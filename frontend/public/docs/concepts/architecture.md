# Architecture

Reputation DAO uses a factory-driven multi-canister design that turns abstract organization policies into fully managed, production-ready reputation systems. This page documents how the moving pieces fit together, how they are operated, and the lifecycle guarantees behind every organization that the platform mints.

## 1. System Goal and Overview

The primary objective is to operate a Motoko-based **Factory Canister** that can spawn, supervise, and retire organization-specific child canisters on demand. The factory owns the full lifecycle — creation, indexing, upgrades, refueling with cycles, and graceful shutdown — while persisting metadata and observability records in stable storage.

At a higher level the system gives communities a secure, non-custodial way to create new organizations ("Orgs") whose state lives entirely on-chain. Every org keeps its own reputation data, configuration, and governance surface area, while the factory enforces global policy and safeguards platform health.

## 2. Core Architectural Components

| Component | Responsibilities |
|-----------|------------------|
| **Factory Canister (`factoria`)** | Central control plane. Handles policy enforcement, payment intents, lifecycle management, upgrades, cycles vaulting, and global indexing. Bundles the canonical `child_wasm` used for new orgs. |
| **Child Canisters (RepDAO Orgs)** | One per organization/community. Spawned from the factory template with locked-in ownership and a reference to the factory principal. Store all reputation balances, role assignments, and org metadata. |
| **DAO Canister Pool** | Reusable pool of prepared canisters. The factory can draw from the pool for rapid provisioning and return idle canisters after reset so resources are recycled instead of reallocated from scratch. |
| **Registry / Mapping Canisters** | Auxiliary storage that maintains key-value indexes of every deployed org. Enables fast lookups by owner, tags, plan, lifecycle state, and more, without bloating the factory state itself. |

## 3. Organizational Lifecycle and Creation Workflow

### 3.1 Organization Creation (`create_org`)

1. **User Payment** – The prospective org owner funds the request in ICP.
2. **Factory Call** – The frontend invokes `create_org(owner, tags, plan, child_wasm, seed_cycles)` on the factory.
3. **Validation & Payment Check** – The factory verifies the ICP intent, plan eligibility, and any policy gating rules before proceeding.
4. **Failure Handling**
   - **Incomplete payment** → the factory returns an error, preserves the form payload, and instructs the user to retry.
   - **Internal error** → an automated refund is initiated to the payer’s DeFi subaccount with an accompanying apology note.
5. **Successful Creation**
   - Mints a unique child canister either from scratch or by leasing one from the pool.
   - Installs the approved WASM, seeds the requested cycles, and binds ownership to the caller’s principal.
   - Writes the org metadata (owner, tags, plan, state) into the registry canister and emits an `ORG_CREATED` event.
   - Updates global indexes so the org appears in dashboards and search.
6. **Child Registration** – On initialization the child canister calls back to the factory with its `org_id`, stores the `factory_principal`, and finalizes the ownership lock.

> **Self-Serve Fast Path:** A convenience variant allows the caller to provision an org with default WASM, seed cycles, and visibility settings without supplying custom parameters. Ownership is implicitly bound to the caller.

### 3.2 Trial Mode

Judges and evaluators can request a time-boxed trial. The factory temporarily assigns a canister from the pool for one hour, after which the canister is reclaimed unless the user converts to a paid plan.

### 3.3 Lifecycle Operations

| Operation | Purpose |
|-----------|---------|
| **Activate Org** | Marks the org as production-ready, makes it discoverable again, or reverses a prior archive. |
| **Archive Org** | Soft-hides the org without deleting state; all data stays intact and can be reactivated at any time. |
| **Retire Org** | Moves the org into a read-only tomb state and optionally invokes `pre_stop()` hooks on the child for graceful shutdown. |
| **Tombstone Org** | Flags aborted creations as permanently invalid while leaving a traceable artifact in the registry. |
| **Batch Lifecycle Ops** | Bulk activate/archive/retire operations that let admins apply policy at scale with a single request. |

## 4. Financial and Cycle Management

Reputation DAO monetizes provisioning via ICP payments that are converted to cycles and consumed by the organizations that run on the Internet Computer.

### 4.1 Payment Intents and Conversion

1. **Per-Org Subaccounts** – Each payment request generates a unique subaccount that ties deposits to the pending org record.
2. **ICP → Cycles Conversion** – Once funds arrive, the factory talks to the Cycles Minting Canister (CMC) to convert ICP to cycles.
3. **Commission Handling** – Platform fees are deducted before cycles are credited to the child seed budget.
4. **Plan-Based Pricing** – Predefined plans (Free / Basic / Pro) map to different seed cycle amounts, quotas, and top-up rules.
5. **Audit Trail** – Every intent transitions through explicit states (pending, paid, failed, refunded) to support reconciliation and compliance.

### 4.2 Cycle Vault and Top-Ups

- **Cycles Vault** – The factory holds cycles in reserve before distributing them to children; balances are queryable for transparency.
- **Manual Top-Ups** – Admins or users can inject additional cycles into specific orgs, either via ICP conversion or direct cycle transfers.
- **Auto Top-Ups** – Policy-driven watchdogs monitor child balances and refuel canisters that fall below a configured threshold.
- **Cycle-End Alerts** – When a child exhausts its cycles, users receive alerts, a grace window opens, and the factory can optionally reset the canister back into the pool.

## 5. Configuration, Upgrades, and Maintenance

### 5.1 Plans, Defaults, and Preconfiguration

| Configuration Item | Description |
|--------------------|-------------|
| **Plan Mapping** | Controls seeded cycles, available features (e.g., decay toggles, analytics), and per-role limits during initialization. |
| **Default Seed Config** | Defines the baseline cycle allocation applied when the caller does not override the seed amount. |
| **Visibility** | A public/private toggle stored in both the child init args and the factory metadata so directory listings stay in sync. |
| **Preconfiguration** | Combines plan defaults, visibility flags, and the approved child WASM into a single bootstrap payload for new orgs. |

### 5.2 Upgrades, Rollbacks, and Batch Operations

- **Upgrade Child** – Installs a new WASM on a live org, updates hash metadata, and emits `UPGRADE_CHILD` events.
- **Upgrade to Approved** – Applies a pre-approved WASM by hash so only vetted binaries are deployed.
- **Rollback Child** – Reinstalls the prior WASM if post-upgrade health checks fail, protecting against regressions.
- **Batch Upgrade** – Processes org upgrades in chunks, returning per-org success/error statuses.
- **System-Wide Updates** – Global maintenance tasks can iterate over every deployed child to enforce policy or new features.

## 6. Observability and Administration

### 6.1 Event Log and Metrics

- **Append-Only Event Log** – Every mutation (create, top-up, upgrade, retire) is time-stamped and queryable with pagination.
- **Org-Scoped Views** – Filters let owners or auditors drill into the history for a single org.
- **Health Snapshot** – Factory health endpoints report active org counts, vault balances, schema versions, and other stats for dashboards.

### 6.2 Health Checks and Monitoring

- **Factory Heartbeats** – Optional periodic jobs ping children for liveness and cycle health.
- **Child Health APIs** – Children expose `health()` / `version()` endpoints so the factory can validate upgrades and runtime state.
- **Alerting Hooks** – Unreachable or low-cycle children are flagged for admin attention and can trigger automated remediation routines.

### 6.3 Maintainer and Admin Panel

- **Admin UI** – A web console lets maintainers visualize all orgs, inspect metadata, and perform manual operations (Upgrade, Retire, Top-Up).
- **Limits & Templates** – Configurable guardrails (maximum WASM size, tag limits, trial duration, org quotas per admin) prevent abuse.
- **Visual Dashboards** – Charts and tables surface operational KPIs, while CRUD tooling supports ad-hoc intervention when needed.

## 7. Reputation DAO Functionality

### 7.1 Reputation Mechanics

| Function | Description |
|----------|-------------|
| **Trust Model** | Reputation is on-chain, transparent, and tamper-proof, removing corruption, bias, and hidden manipulation. |
| **Manual Assignment** | Admins allocate reputation directly and receive daily issuance budgets within each org. |
| **Automatic Assignment** | Embedded systems (e.g., on-chain "likes") can trigger automatic awards to accelerate recognition loops. |
| **Usage & Rewards** | Members use reputation to unlock incentives, benefits, or governance privileges. |
| **Verification** | Anyone can verify balances on-chain at any time, ensuring ownership and transparency. |

### 7.2 Admin and Awarder Actions

Within each child org canister the admin or trusted awarders can:

- Award or revoke reputation
- Review detailed reputation logs and leaderboards
- Trigger decay or health checks where applicable
- Initiate reward redemption workflows (if configured)

## 8. Mental Model

> Think of the Reputation DAO platform as a **digital factory floor**. The Factory Canister is the precision CNC machine that receives raw materials (ICP payments) and blueprints (plans / WASM). It outputs unique, production-grade child canisters, while the Admin Panel is the supervisory dashboard engineers use to monitor telemetry, adjust parameters, and intervene before any unit runs out of fuel (cycles).

## Related Documentation

- [Core Concepts](/docs/concepts/overview)
- [Factory API](/docs/api/factory)
- [Child API](/docs/api/child)
