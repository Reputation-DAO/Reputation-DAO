# Reputation DAO

> [!IMPORTANT]
> Soulbound reputation infrastructure for the Internet Computer. Reputation DAO combines a Motoko canister suite, a multi-tenant factory, and a React/Vite frontend to let communities mint, decay, and audit trust signals on chain.

**At a glance**
- **Stack** Motoko canisters + factory orchestrator + React/Vite frontend with connect2ic integration.
- **Value** Non-transferable (soulbound) reputation with configurable decay, granular controls, and comprehensive audit trails.
- **Use cases** DAOs, online communities, professional networks, and any collective that needs verifiable trust signals.

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
- [Deployment Checklist](#deployment-checklist)
- [Testing and Tooling](#testing-and-tooling)
- [Operations & Observability](#operations--observability)
- [Community & Contribution](#community--contribution)
- [Security](#security)
- [License](#license)

## Overview
Digital trust is scattered, opaque, and centrally controlled. Reputation DAO fixes that with a universal, soulbound reputation layer on the Internet Computer and an optional, policy-driven money layer that never mutates reputation.

**What it is**
- Soulbound reputation per org: non-transferable, earned-only scores bound to a user’s identity; configurable decay keeps scores fresh.
- Factory + child pattern: the factory mints/archives child canisters, sets controllers, and stores the canonical child WASM; each child runs its own org rules, award/revoke flows, and analytics.
- Optional economic layer: a treasury canister can listen to reputation events and (if an org enables it) pay out via ckBTC, ICP, or ckETH/EVM assets. Payments respond to trust signals; they never adjust the underlying reputation.
- Live site: [reputationdao.com](https://reputationdao.com/)

**Why it matters**
- Trust-first, money-optional: communities can run pure reputation or attach one/many rails later without code changes to the core.
- Self-regulating and scalable: caps/blacklists/pause switches, decay engine, automated negative scoring hooks, and room for on-chain AI anomaly detection/Sybil resistance.
- Cross-ecosystem ready: reputation stays on ICP; attestations and identity bridges can make it portable to other chains.

**Stack highlights**
- Motoko canisters for the factory, child reputation logic, treasury, and blog CMS; optional Rust SIWB/SIWE providers.
- Factory-managed multi-tenancy with cycle top-ups, lifecycle state, and audit logs.
- React/Vite frontend (shadcn + Tailwind + MUI blend) with Plug/II/SIWB/SIWE auth, org dashboards, docs, and community content.

## Architecture

| Layer | Purpose | Primary Source |
| --- | --- | --- |
| **Factory canister** | Stores the canonical child WASM, spins up new instances on demand, tracks lifecycle state (Active / Archived), manages metadata and cycle budgets, and wraps IC management APIs for upgrades, start/stop, reinstall, top-ups, and cycle recovery back to the factory vault. | `src/factoria/main.mo` |
| **Child reputation canister** | Actor class deployed per organization via the factory. Enforces soulbound balances, blacklist rules, per-awarder mint limits, throttled multi-award and revocation flows, configurable decay engine (rate, interval, thresholds, grace period), analytics (`leaderboard`, `awarderStats`, `orgPulse`), immutable transaction history, and emits operational events. Handles cycles monitoring, manual/automatic decay, snapshot hashing, and two-step ownership transfers. | `src/reputation_dao/main.mo` |
| **Blog backend** | Provides a simple persistent CMS canister backing the marketing/blog section of the frontend. | `src/blog_backend/main.mo` |
| **Frontend** | React + Vite + TypeScript app with connect2ic integration for Plug, Stoic, and Internet Identity. Implements role-aware dashboards (admin / awarder / member), documentation, community touchpoints, and theming via Tailwind, shadcn/ui, Radix, and MUI fragments. | `frontend/` |

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
│   ├── src/lib/canisters/    # Actor factories (child, factoria, treasury)
│   ├── src/features/         # Dashboard, org selector, docs, community, blog
│   ├── src/contexts/         # Auth, role, theming providers
│   └── env.example           # Vite environment template for canister IDs
├── factoria_test.sh          # End-to-end sanity script for factory lifecycle
├── test_factoria_child.sh    # Additional helper scripts for factory testing
├── test_secure_deposit.sh    # Smoke test for ledger-verified deposits
├── test_multi_org*.sh        # Legacy multi-org smoke tests (playground examples)
├── SETUP.md                  # Windows/WSL and frontend setup notes
├── SECURITY.md               # Security policy template (needs project-specific update)
└── LICENSE                   # MIT License
```

## Key Capabilities
- **Soulbound balances** – reputation is non-transferable and bound to the earning principal.
- **Granular mint control** – per-awarder daily caps, blacklist support, a pause switch, and multi-award batching.
- **Decay & freshness** – configurable decay schedule keeps scores timely while protecting new participants.
- **Cycles management** – factory vault tops up children, tracks top-up history, and can drain unused cycles.
- **Ledger-verified treasury deposits** – ckBTC/ICP/ckETH deposits are matched against ledger balances before vault crediting; admins can inspect per-rail deposit status to prevent spoofed credits.
- **Analytics out of the box** – transaction history, awarder breakdowns, leaderboards, org pulse, decay statistics.
- **Factory-managed multi-tenancy** – create, archive, reuse, and reassign child canisters per org with a single API.
- **Modern UX** – wallet onboarding, role detection, dashboards, docs, and community calls-to-action in the frontend.

## Prerequisites
> [!TIP]
> Align local toolchains with production early to avoid deployment drift.

| Tooling | Notes |
| --- | --- |
| `dfx` | Version 0.27.0 (matches `dfx.json`). |
| Node.js & npm | Node 18+ (tested on Node 24.x) and npm 9+. |
| System utilities | Git, bash or zsh, and Python 3 for helper scripts. |
| Wallets | Plug (recommended) or Stoic / Internet Identity for frontend interactions. |
| Optional | `ic-repl` or similar tooling for scripted integration tests. |

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
> [!IMPORTANT]
> The factory owns the canonical child WASM. Upload a fresh build whenever the child canister changes.

```bash
# From the repo root
# Deploy all canisters to the local network
dfx deploy --network local

# (Re)build the child WASM and upload it to the factory vault
# `factoria_test.sh` can regenerate the blob argument for you; the script below writes to /tmp/reputation_dao_wasm.arg.
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

# Mint a child for your identity (adjust cycle allocation as needed)
OWNER_PRINCIPAL=$(dfx identity get-principal)
dfx canister call factoria createChildForOwner "(principal \"$OWNER_PRINCIPAL\", 1_000_000_000_000:nat, vec {}, \"local dev child\")"

# If you change treasury APIs (e.g., deposit verification), redeploy and regenerate bindings
dfx deploy treasury --network local
dfx generate
# Copy updated Candid outputs from .dfx/local/canisters/treasury into frontend/src/declarations/ if they differ
```

> [!NOTE]
> The final command prints the principal of the new child canister—use it in subsequent calls and in your frontend `.env`.

### 4. Configure the frontend
```bash
cp frontend/env.example frontend/.env
```

Populate the `.env` file with values from your local deployment:

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
> [!WARNING]
> Running a child canister without the factory means you manage cycles, upgrades, and ownership manually.

```bash
OWNER=$(dfx identity get-principal)
FACTORY=$OWNER

dfx deploy reputation_dao --argument "(principal \"$OWNER\", principal \"$FACTORY\")"
```

## Working with the Factory and Child Canisters

### Factory commands

| Action | Command |
| --- | --- |
| List children | `dfx canister call factoria listChildren` |
| Inspect a child | `dfx canister call factoria getChild "(principal \"<child_id>\")"` |
| Stop / start a child | `dfx canister call factoria stopChild "(principal \"<child_id>\")"` |
| Archive a child (reusable pool) | `dfx canister call factoria archiveChild "(principal \"<child_id>\")"` |
| Top up cycles from the factory vault | `dfx canister call factoria topUpChild "(principal \"<child_id>\", 1_000_000_000:nat)"` |

### Child canister commands (`reputation_dao`)
- Award reputation: `dfx canister call <child_id> awardRep "(principal \"<user>\", 10:nat, opt \"Helpful review\")"`
- Batch award (atomic flag): `dfx canister call <child_id> multiAward "(vec { (principal \"<user1>\", 5:nat, null); ... }, true)"`
- Revoke reputation: `dfx canister call <child_id> revokeRep "(principal \"<user>\", 5:nat, opt \"Spam\")"`
- Manage awarders: `addTrustedAwarder`, `removeTrustedAwarder`, `setPerAwarderDailyLimit`
- Configure decay: `configureDecay` (basis points, interval, thresholds, enabled flag)
- Pause or blacklist if abuse is detected: `pause`, `blacklist`
- Analytics: `leaderboard`, `getTransactionHistory`, `awarderStats`, `getDecayStatistics`, `orgPulse`
- Operations: `health`, `cycles_balance`, `topUp`, `withdrawCycles`, `returnCyclesToFactory`

Refer to `src/reputation_dao/main.mo` for complete signatures and inline documentation.

## Frontend Application
- Entry point: `frontend/src/main.tsx`; routing handled in `frontend/src/App.tsx`.
- Wallet integration: `frontend/src/connect2ic.ts` plus `frontend/src/lib/canisters/*` (child, factoria, treasury) for Plug/II/SIWB/SIWE-aware actors.
- Role detection & access control: `frontend/src/contexts/RoleContext.tsx` + `frontend/src/features/orgs/hooks/useOrgData.ts` derive admin / awarder / member roles and org state.
- Key pages:
  - Org selection & payments: `frontend/src/features/orgs/OrgSelectorPage.tsx` (Basic plan payment instructions, mark-as-paid/sweep flows).
  - Admin dashboards: `frontend/src/features/dashboard/pages/*` (e.g., `EconomySettingsPage` for treasury rails, ledger-verified deposits/withdrawals).
  - Docs & API reference: `frontend/src/components/docs/*`.
  - Community/blog: `frontend/src/features/community` and `frontend/src/components/blog/` (backed by the `blog_backend` canister).
- Styling: Tailwind CSS, shadcn/ui components, Radix primitives, and custom CSS in `frontend/src/App.css` / `frontend/src/index.css`.
- NPM scripts:
  - `npm run dev` – local dev server.
  - `npm run build` / `npm run preview` – production build and preview.
  - `npm run lint` – ESLint configuration (see `eslint.config.js`).

### Bitcoin Sign-In (SIWB)

- The frontend now supports Sign-In with Bitcoin (SIWB) via the [Astrox SIWB provider](https://github.com/AstroxNetwork/ic-siwb). Wraps the global app with `SiwbIdentityProvider` so React components can call `useSiwbIdentity()` alongside the existing Plug and Internet Identity flows (`frontend/src/App.tsx`).
- Deploy the `ic_siwb_provider` canister (Rust) once per environment and configure it with your frontend domain, URI, salt, and allowed target canisters. Record its principal plus RPC host inside `.env`:
  ```
  VITE_SIWB_PROVIDER_CANISTER_ID=be2us-64aaa-aaaaa-qaabq-cai
  VITE_SIWB_PROVIDER_HOST=https://icp-api.io   # or http://127.0.0.1:4943 for local
  ```
- `AuthContext` understands a third `authMethod` (`'siwb'`), surfaces the caller’s Bitcoin address, and builds Motoko actors by injecting the SIWB `DelegationIdentity`. Wallets that speak the LaserEyes API (Xverse, Unisat, OKX, etc.) can now connect through the `/auth` page’s “Sign in with Bitcoin” card.
- No Motoko changes are required if SIWB is only used for authentication. If you need a BTC ↔ principal mapping, read it from the provider canister via `get_address` / `get_principal` or persist it inside the child canisters.

### Ethereum Sign-In (SIWE)

- SIWE support mirrors the SIWB flow via [kristopher lund](https://github.com/kristoferlund/ic-siwe) (bald but genius guys) uses the `ic_siwe_provider` canister and your Ethereum wallet (e.g., MetaMask/Rainbow via WalletConnect-capable bridges).
- Configure `.env` with:
  ```
  VITE_SIWE_PROVIDER_CANISTER_ID=uopo7-siaaa-aaaam-qeppq-cai
  VITE_SIWE_PROVIDER_HOST=https://icp-api.io   # or http://127.0.0.1:4943 for local
  ```
- `AuthContext` tracks `authMethod === 'siwe'`, exposes the connected ETH address, and builds child/factoria/treasury actors with the SIWE-derived `DelegationIdentity`.
- The `/auth` page offers “Sign in with Ethereum”; once authenticated, dashboards behave the same as Plug/II/SIWB (role checks, treasury actions, payments).

## Deployment Targets

| Target | Endpoint / Command | Notes |
| --- | --- | --- |
| Local replica | Default `dfx start` at `http://127.0.0.1:4943`. | Ideal for end-to-end development. |
| Playground | `dfx --network playground` with API hosts `https://icp-api.io` or `https://ic0.app`. | 20-minute hosted sandbox for demos; remember to update Vite env vars. |
| Mainnet | `dfx --network ic` using IDs in `canister_ids.json`. | Rotate controllers and fund cycles before production traffic. |

## Deployment Checklist
1. `dfx deploy --network <target>` for each canister (deploy the factory first so children can be minted).
2. Upload the compiled child WASM with `setDefaultChildWasm` whenever child code changes.
3. Regenerate the Vite env (`frontend/.env.production`) with the latest canister IDs.
4. Build the frontend (`npm run build`) and deploy assets via `dfx deploy frontend` or your preferred hosting.
5. Smoke test using `factoria_test.sh` or manual `dfx canister call` commands.

## Testing and Tooling
- `factoria_test.sh` – comprehensive factory lifecycle script verifying WASM uploads, child creation, top-ups, lifecycle operations, and ownership reassignment.
- `test_secure_deposit.sh` – quick check that treasury rejects fake deposits and returns ledger-derived deposit addresses.
- `test_factoria_child.sh`, `test_multi_org.sh`, `test_multi_org_fixed.sh`, `main_net_child_test.sh` – targeted helpers for CI smoke tests or manual regression runs.
- Motoko unit tests are not yet implemented; next steps include Motoko-level property tests and Jest/Vitest coverage for key frontend hooks and services.

## Operations & Observability
- `dfx canister call <child_id> health` exposes paused state, cycles balance, user count, transaction count, and decay configuration hash.
- Analytics endpoints (`leaderboard`, `awarderStats`, `orgPulse`) provide quick snapshots for dashboards and exports.
- Track decay posture with `getDecayStatistics`, `getUserDecayInfo`, and the batch/trigger APIs (`processBatchDecay`, `triggerManualDecay`) for backfills.
- Maintain cycles hygiene by monitoring `cycles_balance`, scheduling factory `topUpChild` calls, and draining via `returnCyclesToFactory` when archiving or reallocating capacity.
- Generate periodic `snapshotHash` outputs to catch state drift across replicas or for audit trails.

## Community & Contribution
- The `/community` page highlights demo videos, the core idea document, presentation decks, and design artifacts—keep links fresh to onboard newcomers.
- Contribution flow:
  1. **File an issue first** describing bugs, feature requests, or research tasks; tag with `backend`, `frontend`, `docs`, or `community`.
  2. **Fork & branch** using `feature/<topic>` or `fix/<bug>`. Keep comments concise and only where logic is non-obvious.
  3. **Extend tests & scripts** by adapting the provided shell suites or adding Motoko/Vitest coverage where it provides value.
  4. **Submit Pull Requests** with clear impact summaries (canister interfaces, frontend UX, docs, ops). Mention any cycles budgets or env file updates that require operator follow-up.
- Grow the ecosystem by hosting onboarding calls, publishing blog updates via the `blog_backend`, empowering guild leads to manage their own child canisters, and sharing integration stories (gating, voting, rewards) through the Docs page.

## Security
> [!WARNING]
> Review and customize `SECURITY.md` before production launch. Define supported versions, disclosure channels, and SLAs that match your operating model.

- Sensitive operations (award, revoke, decay, cycles withdrawal) require authenticated principals—harden awarder lists and controller sets before opening access.
- Rotate controllers regularly and guard the factory admin principal. Consider splitting duties across hardware wallets for mainnet deployments.

## License
This project is released under the [MIT License](LICENSE).
