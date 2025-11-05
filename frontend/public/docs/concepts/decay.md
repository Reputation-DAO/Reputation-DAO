# Decay System

Reputation DAO keeps community reputation relevant by continuously decaying stale balances. Decay is orchestrated by each child canister and parameterized through factory-provisioned configuration so organizations can choose how fast reputation should age.

## 1. Why Decay Matters

- **Fresh Signals** – Encourages ongoing contribution instead of one-time achievements dominating the leaderboard.
- **Anti-Inflation** – Prevents infinite growth of balances by gradually reclaiming idle reputation.
- **Adaptive Governance** – Gives admins a lever to reward consistency while still recognizing long-term contributors.

## 2. Core Mechanics

Each org stores a `DecayConfig` structure (see `Core Concepts → Decay System`). At scheduled intervals the child evaluates the config and applies proportional reductions to eligible balances:

1. Determine if decay is globally enabled (`enabled` flag).
2. Skip members inside the grace window (`gracePeriod`).
3. For every balance above `minThreshold`, multiply by `(1 - decayRate)`.
4. Persist the new total and record a `Decay` transaction entry for auditing.

The decay engine is typically triggered by a timer task/heartbeat or by explicit admin calls (e.g., via CLI or UI). Because calculations are deterministic, queries remain predictable across replicas.

## 3. Configuration Options

| Field | Purpose |
|-------|---------|
| `decayRate` | Basis points removed per interval (e.g., `500` = 5%). |
| `decayInterval` | Seconds between automatic decay passes. |
| `minThreshold` | Balances below this value are ignored to avoid dust churn. |
| `gracePeriod` | New members remain exempt for the first N seconds. |
| `enabled` | Master toggle; when `false`, decay pauses but history remains. |

Admins update these settings through the org configuration UI or via `configureDecay` in the child canister API. Changes take effect on the next decay cycle.

## 4. Operational Controls

- **Manual Trigger** – Admins can invoke a manual decay run after large reputation injections to keep metrics normalized.
- **Simulation Mode** – Tooling can preview the next decay step (projected totals) without mutating state, making it safer to experiment with rates.
- **Rollback** – Because every decay generates a transaction entry, admins can reconcile or compensate for aggressive decay by re-awarding points transparently.

## 5. Monitoring and Analytics

- **Decay Transactions** – Query the transaction log filtered by `txType = Decay` to understand historical impact.
- **Leaderboards** – Compare pre- and post-decay standings to ensure the chosen rate aligns with community expectations.
- **Alerts** – Combine decay events with cycle or participation metrics to spot when overall engagement might be dropping.

## 6. Best Practices

1. Start with conservative rates (1–2% weekly) and adjust based on live feedback.
2. Pair decay with participation incentives so users understand how to replenish reputation.
3. Use the grace period to shield newcomers from immediate decay and improve onboarding sentiment.
4. Document policy publicly so members know why their balances change over time.

## Related Documentation

- [Core Concepts](/docs/concepts/overview)
- [Configuring Decay](/docs/guides/decay-config)
- [Child API](/docs/api/child)
