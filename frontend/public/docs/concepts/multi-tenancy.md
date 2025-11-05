# Multi-Tenancy

Reputation DAO is inherently multi-tenant: a single factory canister manages hundreds of independent organizations without their data ever touching. This pattern delivers economies of scale (shared provisioning, shared tooling) while preserving the security and isolation guarantees of individual smart contracts.

## 1. Factory Pattern Recap

- **Central Orchestrator** – The `factoria` canister stores the canonical child WASM, enforces policy, handles payments, and keeps an index of all orgs.
- **Template Provisioning** – New orgs are instantiated from the same audited WASM bundle so updates and security fixes are distributed consistently.
- **Lifecycle Automation** – Creation, activation, retirement, and upgrades are automated through factory APIs, simplifying day-to-day operations.

## 2. Isolation Guarantees

- **Dedicated State** – Every org runs inside its own child canister with separate stable memory and message queues.
- **Principal Ownership** – Ownership is locked to the provisioning principal; cross-org calls need explicit bridges, preventing accidental leakage.
- **Access Control** – Role assignments (admins, awarders, members) are scoped per org. Gaining admin rights in one org does not grant privileges anywhere else.
- **Cycle Accounting** – Each child tracks its own cycle consumption so one org can’t drain resources allocated to another.

## 3. Organization Management Flows

| Action | Factory Responsibility | Child Responsibility |
|--------|------------------------|----------------------|
| **Create Org** | Allocate or lease a canister, install WASM, seed cycles, register metadata. | Initialize state, store factory principal, confirm ownership lock. |
| **Update Config** | Persist new settings in registry for observability. | Apply plan flags (decay, limits, visibility) within the org. |
| **Upgrade** | Dispatch vetted WASM, emit upgrade events, monitor post-upgrade health. | Swap WASM, run migrations, report version. |
| **Retire / Archive** | Mark global state, reclaim or park cycles, update indexes. | Enter read-only or archived mode as instructed. |

## 4. Resource Allocation and Cycles Management

- **Seed Budgets** – Plans determine initial cycles and quotas per org, ensuring fair distribution.
- **Per-Org Vaults** – The factory tracks credits/debits to each child so top-ups and refunds remain auditable.
- **Auto Top-Ups** – Policy-driven monitors refuel low-cycle orgs without affecting neighbors.
- **Reclamation** – Retired orgs can have remaining cycles reclaimed and recycled via the canister pool.

## 5. Scaling Strategies

- **Horizontal Scaling** – The factory remains lightweight by offloading heavy workloads to children; scaling primarily involves running more children in parallel.
- **Sharding via Registry Canisters** – Index data can be partitioned across auxiliary canisters when counts grow large, keeping lookup times predictable.
- **Batch Operations** – Admin actions (upgrades, lifecycle changes) can target groups of orgs to minimize operational overhead.
- **Observability Tooling** – Unified dashboards show fleet health so maintainers can spot anomalies without drilling into individual canisters first.

## Related Documentation

- [Core Concepts](/docs/concepts/overview)
- [Factory API](/docs/api/factory)
- [Architecture](/docs/concepts/architecture)
