# Core Concepts

Understanding the fundamental concepts behind Reputation DAO.

## What is Soulbound Reputation?

Soulbound reputation is **non-transferable** reputation that is permanently bound to a principal (identity). Unlike tokens that can be traded or transferred, soulbound reputation:

- Cannot be sold or transferred to another identity
- Represents genuine earned trust and contributions
- Decays over time to maintain relevance
- Provides tamper-proof proof of participation

## Architecture Overview

Reputation DAO uses a **factory pattern** to enable multi-tenancy while maintaining isolation between organizations.

### Factory Canister

The factory canister (`factoria`) is the orchestration layer that:

- **Stores the canonical child WASM** - One source of truth for all child canisters
- **Manages child lifecycle** - Create, start, stop, archive, and upgrade children
- **Handles cycles** - Maintains a vault and tops up children automatically
- **Tracks ownership** - Maps organizations to their child canisters
- **Enforces quotas** - Prevents abuse through rate limiting

```motoko
// Factory creates children on demand
public shared(msg) func createChildForOwner(
  owner: Principal,
  initialCycles: Nat,
  controllers: [Principal],
  notes: Text
) : async Principal
```

### Child Canister

Each organization gets a dedicated child canister (`reputation_dao`) that:

- **Manages reputation balances** - Soulbound, non-transferable scores
- **Enforces minting rules** - Per-awarder limits, blacklists, pause switch
- **Handles decay** - Configurable decay rate, interval, and thresholds
- **Provides analytics** - Leaderboards, transaction history, statistics
- **Emits events** - Operational logging for monitoring

```motoko
// Child manages reputation for one organization
public shared(msg) func awardRep(
  user: Principal,
  amount: Nat,
  reason: ?Text
) : async Result.Result<(), Text>
```

## Key Concepts

### 1. Soulbound Tokens

Reputation points are **bound to the earning principal** and cannot be transferred. This ensures:

- **Authenticity** - Reputation represents real contributions
- **Trust** - Cannot be bought or sold
- **Accountability** - Actions are tied to identity

### 2. Decay System

Reputation naturally decays over time to keep scores fresh and relevant:

```typescript
interface DecayConfig {
  decayRate: number;        // Basis points (500 = 5%)
  decayInterval: number;    // Seconds between decay events
  minThreshold: number;     // Minimum balance to decay
  gracePeriod: number;      // New users protected for X seconds
  enabled: boolean;         // Master switch
}
```

**Why Decay?**
- Keeps reputation current and relevant
- Encourages ongoing participation
- Prevents stale scores from dominating
- Protects new members during onboarding

### 3. Role-Based Access Control

Three primary roles govern the system:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Admin** | Full control, manage awarders, configure decay | Organization owner |
| **Awarder** | Award and revoke reputation | Community moderators |
| **Member** | View balances, transaction history | Regular participants |

### 4. Multi-Tenant Architecture

The factory pattern enables:

- **Isolation** - Each org has dedicated state and cycles
- **Scalability** - Horizontal scaling through child canisters
- **Flexibility** - Per-org configuration and rules
- **Efficiency** - Shared WASM reduces deployment overhead

### 5. Cycles Management

The Internet Computer uses **cycles** as compute fuel. Reputation DAO handles this through:

- **Factory Vault** - Central cycles pool for all children
- **Automatic Top-ups** - Factory monitors and refills children
- **Cycle Recovery** - Drain unused cycles back to factory
- **Budget Tracking** - Per-child cycle consumption history

## Data Model

### User Balance

```typescript
interface UserBalance {
  principal: Principal;
  balance: bigint;
  lastDecayTime: bigint;
  createdAt: bigint;
  totalAwarded: bigint;
  totalRevoked: bigint;
  totalDecayed: bigint;
}
```

### Transaction

```typescript
interface Transaction {
  id: bigint;
  txType: 'Award' | 'Revoke' | 'Decay';
  from: Principal;
  to: Principal;
  amount: bigint;
  reason?: string;
  timestamp: bigint;
}
```

### Awarder

```typescript
interface Awarder {
  principal: Principal;
  displayName: string;
  dailyLimit: bigint;
  totalAwarded: bigint;
  addedAt: bigint;
  addedBy: Principal;
}
```

## Security Model

### Authentication

- All operations require **authenticated principals**
- Internet Identity, Plug, or Stoic wallet integration
- No anonymous calls for state-changing operations

### Authorization

- **Role checks** before sensitive operations
- **Per-awarder limits** prevent abuse
- **Blacklist** for bad actors
- **Pause switch** for emergencies

### Auditability

- **Immutable transaction log** - Complete history
- **Event emissions** - Real-time monitoring
- **Snapshot hashing** - State verification
- **Cycle tracking** - Resource accountability

## Performance Characteristics

### Scalability

- **Horizontal** - Add more child canisters as needed
- **Vertical** - Each child handles thousands of users
- **Efficient** - Stable memory for large datasets

### Latency

- **Query calls** - Sub-second response times
- **Update calls** - 2-4 seconds for consensus
- **Batch operations** - Atomic multi-award support

### Storage

- **Stable memory** - Persistent across upgrades
- **Efficient encoding** - Optimized data structures
- **Garbage collection** - Automatic cleanup

## Next Steps

### 🏗️ [Architecture Deep Dive](/docs/concepts/architecture)
Detailed system design and component interactions

### ⏰ [Decay System](/docs/concepts/decay)
How reputation decays over time

### 🔒 [Security Model](/docs/security/model)
Trust and safety mechanisms

### 📖 [Deploy Your First Org](/docs/guides/first-org)
Hands-on tutorial for creating your first organization
