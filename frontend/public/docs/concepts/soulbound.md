# Soulbound Tokens

## What are Soulbound Tokens?

Soulbound tokens are **non-transferable** digital assets that are permanently bound to a specific identity or account. In the context of Reputation DAO, soulbound reputation means:

- **Cannot be transferred** to another user
- **Cannot be sold** or traded
- **Represents genuine earned reputation** through contributions
- **Tied to your identity** on the Internet Computer

## Why Soulbound?

Traditional tokens can be bought, sold, or transferred, which creates problems for reputation systems:

❌ **Reputation can be bought** - Wealthy users can purchase reputation
❌ **Reputation can be sold** - Users can sell their hard-earned reputation
❌ **Reputation can be transferred** - Users can game the system with multiple accounts
❌ **Reputation doesn't reflect reality** - It becomes about wealth, not contribution

With soulbound reputation:

✅ **Reputation is earned** - Only through genuine contributions
✅ **Reputation is authentic** - Reflects real participation
✅ **Reputation is accountable** - Tied to your identity
✅ **Reputation is meaningful** - Cannot be gamed or manipulated

## How It Works

### Minting

When you earn reputation:

```motoko
public shared(msg) func awardRep(
  user: Principal,
  amount: Nat,
  reason: ?Text
) : async Result.Result<(), Text> {
  // Reputation is minted directly to the user's principal
  // It cannot be transferred after minting
}
```

### Storage

Reputation is stored in a HashMap keyed by Principal:

```motoko
private stable var balances : HashMap.HashMap<Principal, Nat> = HashMap.HashMap(
  10,
  Principal.equal,
  Principal.hash
);
```

### Enforcement

The canister enforces soulbound properties:

- ❌ No `transfer` function exists
- ❌ No `approve` or `allowance` functions
- ❌ No way to move reputation between principals
- ✅ Only `award` and `revoke` by authorized awarders

## Benefits

### For Communities

- **Trust** - Reputation reflects real contributions
- **Quality** - Cannot buy your way to high reputation
- **Accountability** - Bad actors can't escape their history
- **Fairness** - Everyone starts from zero

### For Users

- **Recognition** - Your contributions are recognized
- **Identity** - Build a reputation tied to your identity
- **Portability** - Your reputation follows you (within the DAO)
- **Permanence** - Cannot be taken away arbitrarily

## Comparison

| Feature | Transferable Tokens | Soulbound Reputation |
|---------|-------------------|---------------------|
| **Transfer** | ✅ Yes | ❌ No |
| **Trade** | ✅ Yes | ❌ No |
| **Sell** | ✅ Yes | ❌ No |
| **Earn** | ✅ Yes | ✅ Yes |
| **Revoke** | ❌ No | ✅ Yes (by admins) |
| **Decay** | ❌ No | ✅ Yes (configurable) |
| **Represents** | Wealth | Contribution |

## Use Cases

### DAO Governance

Soulbound reputation is perfect for governance:

- **Voting power** based on contributions, not wealth
- **Proposal rights** earned through participation
- **Delegation** not possible (prevents vote buying)

### Community Moderation

Reputation helps identify trusted members:

- **Moderator selection** based on earned trust
- **Content curation** weighted by reputation
- **Spam prevention** through reputation requirements

### Access Control

Gate features by reputation:

- **Premium features** for high-reputation users
- **Early access** for contributors
- **Special roles** based on reputation thresholds

## Technical Implementation

### No Transfer Function

Unlike ERC-20 or ICRC-1 tokens, there is no transfer function:

```motoko
// ❌ This function does NOT exist
// public func transfer(to: Principal, amount: Nat) : async Result

// ✅ Only these functions exist
public func awardRep(user: Principal, amount: Nat) : async Result
public func revokeRep(user: Principal, amount: Nat) : async Result
```

### Immutable History

All reputation changes are logged:

```motoko
type Transaction = {
  id: Nat;
  txType: TransactionType; // Award, Revoke, Decay
  from: Principal;
  to: Principal;
  amount: Nat;
  reason: ?Text;
  timestamp: Time.Time;
};
```

### Decay Mechanism

Reputation naturally decays over time to keep it current:

```motoko
// Decay reduces reputation but doesn't transfer it
// The reputation is simply reduced, not moved
func applyDecay(user: Principal) : () {
  let balance = getBalance(user);
  let decayed = balance * decayRate / 10000;
  balances.put(user, balance - decayed);
}
```

## Future Considerations

### Cross-DAO Reputation

While reputation is soulbound within a DAO, we're exploring:

- **Reputation attestations** - Provable claims about reputation
- **Cross-DAO queries** - View reputation across DAOs
- **Reputation aggregation** - Combined reputation scores

### Reputation Recovery

For lost identities:

- **Social recovery** - Trusted contacts can help recover
- **Time-locked transfers** - One-time migration with delay
- **Attestation-based** - Prove ownership of old identity

## See Also

- [Decay System](/docs/concepts/decay) - How reputation decays over time
- [Core Concepts](/docs/concepts/overview) - Overall architecture
- [API Reference](/docs/api/child) - Technical implementation
