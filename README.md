# Reputation DAO

Soulbound reputation infrastructure for the Internet Computer. Reputation DAO combines a Motoko canister suite, a multi-tenant factory, and a React/Vite frontend to let communities mint, decay, and audit trust signals on chain.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Key Capabilities](#key-capabilities)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Start local replica](#2-start-local-replica)
  - [3. Deploy canisters with the factory](#3-deploy-canisters-with-the-factory)
  - [4. Configure the frontend](#4-configure-the-frontend)
  - [5. Run the frontend locally](#5-run-the-frontend-locally)
  - [Optional: deploy a standalone child canister](#optional-deploy-a-standalone-child-canister)
- [Working with the Factory and Child Canisters](#working-with-the-factory-and-child-canisters)
- [Frontend Application](#frontend-application)
- [Deployment Targets](#deployment-targets)
- [Testing and Tooling](#testing-and-tooling)
- [Operations & Observability](#operations--observability)
- [Community & Contribution](#community--contribution)
- [Security](#security)
- [License](#license)

## Overview
Reputation DAO provides a tamper-proof trust layer for DAOs, online communities, and professional networks. Reputation points are non-transferable ("soulbound"), subject to configurable decay, and fully auditable on-chain. The stack ships with:

- Motoko canisters for reputation logic, multi-tenant orchestration, and supporting content.
- A factory that mints dedicated child canisters per organization, manages controllers, and automates cycles top-ups.
- A modern React/Vite frontend (shadcn + Tailwind + MUI blend) that surfaces dashboards, role-based flows, docs, and community content.

## Architecture

**Factory (`src/factoria/main.mo`)**
- Stores the canonical WASM for child reputation canisters and spins up new instances on demand.
- Tracks ownership, lifecycle state (Active / Archived), cycle budgets, and metadata for every child.
- Wraps IC management APIs for start/stop, upgrade, reinstall, top-ups, and cycle recovery back to the factory vault.

**Child Reputation Canister (`src/reputation_dao/main.mo`)**
- Actor class deployed per organization via the factory.
- Enforces soulbound balances, blacklist rules, per-awarder mint limits, throttled multi-award, revocation, and reset flows.
- Provides a decay engine (configurable rate, interval, thresholds, grace period) plus analytics (`leaderboard`, `awarderStats`, `orgPulse`, etc.).
- Records immutable transaction history, top-up logs, and emits custom events for downstream processing.
- Manages operational duties: cycles monitoring, manual/automatic decay, snapshot hashing, and two-step ownership transfers.

**Blog Backend (`src/blog_backend/main.mo`)**
- Simple persistent CMS canister backing the marketing/blog section of the frontend.

**Frontend (`frontend/`)**
- React + Vite + TypeScript with connect2ic integration for Plug, Stoic, and Internet Identity.
- Role-aware dashboard (admin / awarder / member) for awarding, revoking, managing trusted awarders, monitoring decay, and reviewing transactions.
- Documentation, community, and marketing pages wired to the project’s external assets.

## Repository Layout
```
Reputation-Dao/
├── dfx.json                  # DFX canister configuration (dfx 0.27.0)
├── canister_ids.json         # Deployed IC canister IDs (ic network slots)
├── src/
│   ├── factoria/             # Factory canister (multi-tenant orchestration)
│   ├── reputation_dao/       # Child soulbound reputation canister
│   └── blog_backend/         # Blog CMS canister
├── frontend/                 # React + Vite application
│   ├── src/components/canister/child.ts  # Helper to create child actors via Plug
│   ├── src/components/canister/factoria.ts # Factory actor helpers & env wiring
│   ├── src/pages/            # Dashboard, docs, community, blog, etc.
│   └── env.example           # Vite environment template for canister IDs
├── factoria_test.sh          # End-to-end sanity script for factory lifecycle
├── test_factoria_child.sh    # Additional helper scripts for factory testing
├── test_multi_org*.sh        # Legacy multi-org smoke tests (playground examples)
├── SETUP.md                  # Windows/WSL and frontend setup notes
├── SECURITY.md               # Security policy template (needs project-specific update)
└── LICENSE                   # MIT License
```

## Key Capabilities
- **Soulbound balances** – reputation is non-transferable and bound to the earning principal.
- **Granular mint control** – per-awarder daily caps, blacklist support, pause switch, and multi-award batching.
- **Decay & freshness** – configurable decay schedule keeps scores relevant over time while protecting new participants.
- **Cycles management** – factory vault tops up children, tracks top-up history, and can drain unused cycles.
- **Analytics out of the box** – transaction history, awarder breakdowns, leaderboards, org pulse, decay statistics.
- **Factory-managed multi-tenancy** – create, archive, reuse, and reassign child canisters per org with a single API.
- **Modern UX** – wallet onboarding, role detection, dashboards, docs, and community calls-to-action embedded in the frontend.

## Prerequisites
- [DFX 0.27.0](https://internetcomputer.org/docs/current/developer-docs/getting-started/install/) (matches `dfx.json`).
- Node.js 18+ (development tested on Node 24.x) and npm 9+.
- Git, bash/zsh, and Python 3 for helper scripts.
- Plug wallet (recommended) or Stoic / Internet Identity for interacting with the frontend.
- Optional: `ic-repl` or similar tooling for scripted integration tests.

## Local Development

### 1. Install dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/Reputation-Dao.git
cd Reputation-Dao

# Backend dependencies are managed by dfx; install frontend packages separately
cd frontend
npm install
cd ..
```

### 2. Start local replica
```bash
dfx start --background --clean
```

### 3. Deploy canisters with the factory
The recommended workflow is to deploy the factory and let it mint per-org child canisters.

```bash
# From repo root
# Deploy all canisters to the local network
dfx deploy --network local

# (Re)build the child WASM and upload it to the factory vault
# You can regenerate a blob argument with `factoria_test.sh` or via the script below (writes to /tmp/reputation_dao_wasm.arg).
dfx build reputation_dao
python3 - <<'PY'
p = ".dfx/local/canisters/reputation_dao/reputation_dao.wasm"
b = open(p, "rb").read()
# IMPORTANT: \%02x (no 'x' after backslash in the output)
with open("/tmp/reputation_dao_wasm.arg","w") as f:
    f.write('(blob "' + ''.join('\\%02x' % x for x in b) + '")')
print("ok, wrote /tmp/reputation_dao_wasm.arg", len(b), "bytes")
PY
dfx canister call factoria setDefaultChildWasm --argument-file /tmp/reputation_dao_wasm.arg

# Mint a child for your identity (cycles arguments may be adjusted)
OWNER_PRINCIPAL=$(dfx identity get-principal)
dfx canister call factoria createChildForOwner "(principal \"$OWNER_PRINCIPAL\", 1_000_000_000_000:nat, vec {}, \"local dev child\")"
```
The command above prints the principal of the new child canister. Use it in subsequent calls and in your frontend `.env` file.

### 4. Configure the frontend
Create `frontend/.env` from the provided template and set the canister IDs returned by the local deployment.

```bash
cp frontend/env.example frontend/.env
```
Update the values inside `.env`. For local development you typically want:
```
VITE_IC_HOST=http://127.0.0.1:4943
VITE_FACTORIA_CANISTER_ID=<principal returned by dfx canister id factoria>
VITE_REPUTATION_DAO_CANISTER_ID=<child canister principal>
VITE_BLOG_BACKEND_CANISTER_ID=<dfx canister id blog_backend>
VITE_FRONTEND_CANISTER_ID=<dfx canister id frontend>
```
If you regenerate Candid interfaces (`dfx generate`), copy the updated declarations into `frontend/src/declarations/`.

### 5. Run the frontend locally
```bash
cd frontend
npm run dev
# Open http://localhost:5173 and connect with Plug, Stoic, or Internet Identity
```

### Optional: deploy a standalone child canister
If you want to deploy the reputation canister without the factory (e.g., for quick prototyping), pass the owner and factory principals explicitly. You can set the factory principal to your developer principal when not using the real factory.

```bash
OWNER=$(dfx identity get-principal)
FACTORY=$OWNER

dfx deploy reputation_dao --argument "(principal \"$OWNER\", principal \"$FACTORY\")"
```
Remember that without the factory you will manage cycles and upgrades manually.

## Working with the Factory and Child Canisters
- List children: `dfx canister call factoria listChildren`
- Inspect a child: `dfx canister call factoria getChild "(principal \"<child_id>\")"`
- Stop / start a child: `dfx canister call factoria stopChild "(principal \"<child_id>\")"`
- Archive a child (moves it to the reusable pool): `dfx canister call factoria archiveChild "(principal \"<child_id>\")"`
- Top up cycles via the factory vault: `dfx canister call factoria topUpChild "(principal \"<child_id>\", 1_000_000_000:nat)"`

Child canister highlights (`reputation_dao`):
- Award reputation: `dfx canister call <child_id> awardRep "(principal \"<user>\", 10:nat, opt \"Helpful review\")"`
- Batch award (atomic false/true): `dfx canister call <child_id> multiAward "(vec { (principal \"<user1>\", 5:nat, null); ... }, true)"`
- Revoke reputation: `dfx canister call <child_id> revokeRep "(principal \"<user>\", 5:nat, opt \"Spam\")"`
- Manage awarders: `addTrustedAwarder`, `removeTrustedAwarder`, `setPerAwarderDailyLimit`
- Configure decay: `configureDecay` (rate in basis points, interval in seconds, thresholds, and enabled flag)
- Pause or blacklist if abuse is detected: `pause`, `blacklist`
- Check analytics: `leaderboard`, `getTransactionHistory`, `awarderStats`, `getDecayStatistics`, `orgPulse`
- Operations: `health`, `cycles_balance`, `topUp`, `withdrawCycles`, `returnCyclesToFactory`

Refer to `src/reputation_dao/main.mo` for full signatures and comments.

## Frontend Application
- Entry point: `frontend/src/main.tsx`, routing defined in `frontend/src/App.tsx`.
- Wallet integration: `frontend/src/connect2ic.ts` and `frontend/src/components/canister/*.ts`.
- Role detection and access control: `frontend/src/contexts/RoleContext.tsx` (queries factory + child to determine admin/awarder/member).
- Key pages:
  - Dashboard flows under `frontend/src/pages/Dashboard.tsx` and related route-specific pages (AwardRep, RevokeRep, ManageAwarders, ViewBalances, TransactionLog, DecaySystem).
  - Documentation and quickstart content in `frontend/src/pages/Docs.tsx` (`components/docs/*`).
  - Community hub in `frontend/src/pages/Community.tsx` linking to demos, Figma artifacts, governance calls, and onboarding resources.
  - Blog powered by `frontend/src/components/blog` and backed by the `blog_backend` canister.
- Styling: Tailwind, shadcn/ui components, Radix primitives, Material UI fragments, and custom theming in `frontend/src/theme.ts`.
- Scripts:
  - `npm run dev` – local dev server.
  - `npm run build` / `npm run preview` – production build & preview.
  - `npm run lint` – ESLint (configured in `eslint.config.js`).

## Deployment Targets
- **Local replica** – default `dfx start` at `http://127.0.0.1:4943`.
- **Playground (dfx --network playground)** – quick 20-minute hosted environment for demos; update Vite env to use `https://icp-api.io` or `https://ic0.app` hosts.
- **Mainnet (`--network ic`)** – ensure canister IDs in `canister_ids.json` match deployed versions and update frontend env accordingly. Remember to rotate controllers and cycles budgets before production.

Deployment checklist:
1. `dfx deploy --network <target>` for each canister (factory first so children can be minted).
2. Upload the compiled child WASM via `setDefaultChildWasm` whenever the child code changes.
3. Regenerate Vite env (`frontend/.env.production`) with mainnet IDs.
4. Build the frontend (`npm run build`) and deploy assets via `dfx deploy frontend` or your preferred hosting setup.
5. Smoke test using `factoria_test.sh` or manual `dfx canister call` commands.

## Testing and Tooling
- `factoria_test.sh` – comprehensive factory lifecycle script (verifies WASM upload, child creation, top-ups, start/stop, owner reassignment, archiving).
- `test_factoria_child.sh`, `test_multi_org.sh`, `test_multi_org_fixed.sh`, `main_net_child_test.sh` – targeted scripts you can adapt for CI smoke tests or manual regression runs.
- Unit tests are not yet implemented for Motoko modules; recommended next steps include Motoko-level property tests and Jest/Vitest coverage for key frontend hooks and services.

## Operations & Observability
- Use `dfx canister call <child_id> health` to retrieve paused state, cycles balance, user count, transaction count, and decay configuration hash.
- `leaderboard`, `awarderStats`, and `orgPulse` provide quick analytics snapshots for dashboards or exports.
- Track decay posture with `getDecayStatistics`, `getUserDecayInfo`, and `processBatchDecay` / `triggerManualDecay` for backfills.
- Cycles hygiene: monitor `cycles_balance`, schedule factory `topUpChild` calls, and drain via `returnCyclesToFactory` when archiving or reallocating capacity.
- Generate periodic `snapshotHash` outputs to detect state drift between replicas or audits.

## Community & Contribution
- The Community page (`/community`) highlights demo videos, the core idea document, presentation decks, and design artifacts. Keep these links updated to guide newcomers.
- Contributions are welcome:
  1. **Issues first** – document bugs, feature requests, or research tasks via GitHub issues (tag with `backend`, `frontend`, `docs`, or `community`).
  2. **Fork & branch** – follow feature branch naming (`feature/<topic>` or `fix/<bug>`). Add concise comments only when logic is not self-explanatory.
  3. **Tests & scripts** – extend the shell scripts or add Motoko/Vitest coverage where sensible.
  4. **Pull requests** – describe the impact (canister interfaces, frontend UX, docs, ops). Mention if cycles budgets or env files need operator action.
- For ecosystem & community growth:
  - Host onboarding calls and workshops (templates in `Community.tsx` can be localized).
  - Publish blog updates via the `blog_backend` canister to surface new releases.
  - Encourage guild leads to manage their own child canisters through the factory for transparent governance.
  - Capture integrations (gating, voting, rewards) and share via the Docs page to inspire other builders.

## Security
- Review and customize `SECURITY.md` before production launch. Define supported versions, disclosure channels, and SLAs that match your operating model.
- Sensitive operations (award, revoke, decay, cycles withdrawal) require authenticated principals; ensure awarder lists and controller sets are hardened before opening access.
- Rotate controllers and guard the factory admin principal. Consider splitting duties across hardware wallets for mainnet deployments.

## License
This project is released under the [MIT License](LICENSE).
