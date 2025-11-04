# Child Smart Contract

Each organization receives an isolated child canister (`src/reputation_dao/main.mo`) with soulbound reputation balances, decay mechanics, and access control.

## Architecture Overview

The child canister is an actor class that provides:
- Soulbound reputation balances
- Trusted awarder system with daily limits
- Configurable decay engine
- Blacklist registry
- Transaction history
- Analytics endpoints

## Core Components

### 1. Soulbound Balances

Reputation is stored in a `Trie` keyed by principal and cannot be transferred.

```motoko
private var balances : Trie.Trie<Principal, Nat> = Trie.empty();

public shared(msg) func awardRep(
  recipient : Principal,
  amount : Nat,
  reason : ?Text
) : async Result.Result<Nat, Text> {
  // Validate caller is trusted awarder
  if (not isTrustedAwarder(msg.caller)) {
    return #err("Not authorized");
  };
  
  // Check blacklist
  if (isBlacklisted(recipient)) {
    return #err("Recipient is blacklisted");
  };
  
  // Check daily limits
  if (not checkDailyLimit(msg.caller, amount)) {
    return #err("Daily limit exceeded");
  };
  
  // Update balance
  let currentBalance = getBalanceInternal(recipient);
  let newBalance = currentBalance + amount;
  balances := Trie.put(balances, keyPrincipal(recipient), Principal.equal, newBalance).0;
  
  // Record transaction
  recordTransaction(#award, msg.caller, recipient, amount, reason);
  
  #ok(newBalance)
};
```

**Key Properties:**
- No transfer function exists
- Balances are bound to earning principals
- Only trusted awarders can mint reputation
- All awards are logged in transaction history

### 2. Trusted Awarders

Awarders have permission to mint reputation with configurable daily limits.

```motoko
type AwarderInfo = {
  principal : Principal;
  displayName : Text;
  addedAt : Int;
  dailyLimit : ?Nat;
  totalAwarded : Nat;
};

private var trustedAwarders : Trie.Trie<Principal, AwarderInfo> = Trie.empty();
private var dailyAwards : Trie.Trie<Principal, DailyStats> = Trie.empty();

public shared(msg) func addTrustedAwarder(
  awarder : Principal,
  displayName : Text
) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  
  let info : AwarderInfo = {
    principal = awarder;
    displayName = displayName;
    addedAt = Time.now();
    dailyLimit = null;
    totalAwarded = 0;
  };
  
  trustedAwarders := Trie.put(trustedAwarders, keyPrincipal(awarder), Principal.equal, info).0;
  #ok()
};

public shared(msg) func setPerAwarderDailyLimit(
  awarder : Principal,
  limit : Nat
) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  
  switch (Trie.find(trustedAwarders, keyPrincipal(awarder), Principal.equal)) {
    case null { #err("Awarder not found") };
    case (?info) {
      let updated = {
        info with dailyLimit = ?limit
      };
      trustedAwarders := Trie.put(trustedAwarders, keyPrincipal(awarder), Principal.equal, updated).0;
      #ok()
    };
  };
};
```

**Daily Limit Enforcement:**

```motoko
type DailyStats = {
  date : Int; // Day timestamp
  awarded : Nat;
};

private func checkDailyLimit(awarder : Principal, amount : Nat) : Bool {
  let today = Time.now() / (24 * 60 * 60 * 1_000_000_000);
  
  // Check global daily limit
  if (dailyMintedToday + amount > dailyMintLimit) {
    return false;
  };
  
  // Check per-awarder limit
  switch (Trie.find(trustedAwarders, keyPrincipal(awarder), Principal.equal)) {
    case null { return false };
    case (?info) {
      switch (info.dailyLimit) {
        case null { return true }; // No limit
        case (?limit) {
          let stats = getDailyStats(awarder, today);
          return (stats.awarded + amount <= limit);
        };
      };
    };
  };
};
```

### 3. Decay Engine

Reputation decays over time to keep scores fresh and relevant.

```motoko
type DecayConfig = {
  enabled : Bool;
  rate : Nat; // Basis points (e.g., 500 = 5%)
  interval : Nat; // Seconds between decay
  threshold : Nat; // Minimum balance for decay
  gracePeriod : Nat; // Seconds before first decay
};

stable var decayConfig : DecayConfig = {
  enabled = false;
  rate = 0;
  interval = 2592000; // 30 days
  threshold = 10;
  gracePeriod = 2592000;
};

type UserDecayState = {
  lastDecayTime : Int;
  lastBalance : Nat;
};

private var decayStates : Trie.Trie<Principal, UserDecayState> = Trie.empty();

public shared(msg) func processBatchDecay() : async Nat {
  requireOwner(msg.caller);
  
  if (not decayConfig.enabled) {
    return 0;
  };
  
  var processed = 0;
  let now = Time.now();
  
  // Iterate through all balances
  for ((principal, balance) in Trie.iter(balances)) {
    if (balance >= decayConfig.threshold) {
      let state = getDecayState(principal);
      let timeSinceLastDecay = now - state.lastDecayTime;
      
      if (timeSinceLastDecay >= decayConfig.gracePeriod) {
        let periods = timeSinceLastDecay / (decayConfig.interval * 1_000_000_000);
        
        if (periods > 0) {
          let decayAmount = (balance * decayConfig.rate * periods) / 10000;
          let newBalance = if (decayAmount >= balance) { 0 } else { balance - decayAmount };
          
          balances := Trie.put(balances, keyPrincipal(principal), Principal.equal, newBalance).0;
          
          // Update decay state
          decayStates := Trie.put(decayStates, keyPrincipal(principal), Principal.equal, {
            lastDecayTime = now;
            lastBalance = newBalance;
          }).0;
          
          // Record transaction
          recordTransaction(#decay, principal, principal, decayAmount, ?"Automatic decay");
          
          processed += 1;
        };
      };
    };
  };
  
  processed
};
```

**Decay Configuration:**

```motoko
public shared(msg) func configureDecay(
  rate : Nat,
  interval : Nat,
  threshold : Nat,
  gracePeriod : Nat,
  enabled : Bool
) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  
  decayConfig := {
    enabled = enabled;
    rate = rate;
    interval = interval;
    threshold = threshold;
    gracePeriod = gracePeriod;
  };
  
  #ok()
};
```

### 4. Blacklist Registry

Block abusive principals from earning or awarding reputation.

```motoko
private var blacklist : Trie.Trie<Principal, BlacklistEntry> = Trie.empty();

type BlacklistEntry = {
  addedAt : Int;
  reason : ?Text;
};

public shared(msg) func blacklist(
  principal : Principal,
  add : Bool
) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  
  if (add) {
    let entry : BlacklistEntry = {
      addedAt = Time.now();
      reason = null;
    };
    blacklist := Trie.put(blacklist, keyPrincipal(principal), Principal.equal, entry).0;
  } else {
    blacklist := Trie.remove(blacklist, keyPrincipal(principal), Principal.equal).0;
  };
  
  #ok()
};

private func isBlacklisted(principal : Principal) : Bool {
  Option.isSome(Trie.find(blacklist, keyPrincipal(principal), Principal.equal))
};
```

### 5. Transaction History

All reputation changes are logged for audit and analytics.

```motoko
type Transaction = {
  id : Nat;
  txType : TxType;
  from : Principal;
  to : Principal;
  amount : Nat;
  reason : ?Text;
  timestamp : Int;
};

type TxType = {
  #award;
  #revoke;
  #decay;
  #reset;
};

stable var transactions : [Transaction] = [];
stable var nextTxId : Nat = 0;

private func recordTransaction(
  txType : TxType,
  from : Principal,
  to : Principal,
  amount : Nat,
  reason : ?Text
) {
  let tx : Transaction = {
    id = nextTxId;
    txType = txType;
    from = from;
    to = to;
    amount = amount;
    reason = reason;
    timestamp = Time.now();
  };
  
  transactions := Array.append(transactions, [tx]);
  nextTxId += 1;
};

public query func getTransactionsPaged(offset : Nat, limit : Nat) : async [Transaction] {
  let total = transactions.size();
  let start = Nat.min(offset, total);
  let end = Nat.min(start + limit, total);
  
  Array.tabulate(end - start, func(i : Nat) : Transaction {
    transactions[start + i]
  })
};
```

### 6. Access Control

The child canister enforces owner-based access control.

```motoko
stable var owner : Principal = installOwner;
stable var pendingOwner : ?Principal = null;
stable var paused : Bool = false;

private func requireOwner(caller : Principal) {
  if (caller != owner) {
    throw Error.reject("Unauthorized: owner only");
  };
};

private func requireNotPaused() {
  if (paused) {
    throw Error.reject("Canister is paused");
  };
};

public shared(msg) func transferOwnership(newOwner : Principal) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  pendingOwner := ?newOwner;
  #ok()
};

public shared(msg) func acceptOwnership() : async Result.Result<(), Text> {
  switch (pendingOwner) {
    case null { #err("No pending transfer") };
    case (?pending) {
      if (msg.caller != pending) {
        return #err("Not the pending owner");
      };
      owner := pending;
      pendingOwner := null;
      #ok()
    };
  };
};

public shared(msg) func pause(shouldPause : Bool) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  paused := shouldPause;
  #ok()
};
```

## Analytics Endpoints

### Leaderboard

```motoko
public query func leaderboard(limit : Nat, offset : Nat) : async [LeaderboardEntry] {
  let entries = Trie.toArray(balances, func(p : Principal, b : Nat) : LeaderboardEntry {
    { principal = p; balance = b }
  });
  
  let sorted = Array.sort(entries, func(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
    Nat.compare(b.balance, a.balance)
  });
  
  let start = Nat.min(offset, sorted.size());
  let end = Nat.min(start + limit, sorted.size());
  
  Array.tabulate(end - start, func(i : Nat) : LeaderboardEntry {
    sorted[start + i]
  })
};
```

### Organization Pulse

```motoko
public query func orgPulse(hours : Nat) : async OrgStats {
  let cutoff = Time.now() - (hours * 60 * 60 * 1_000_000_000);
  
  var recentAwards = 0;
  var recentRevokes = 0;
  var activeAwarders = 0;
  
  for (tx in transactions.vals()) {
    if (tx.timestamp >= cutoff) {
      switch (tx.txType) {
        case (#award) { recentAwards += 1 };
        case (#revoke) { recentRevokes += 1 };
        case _ {};
      };
    };
  };
  
  {
    totalUsers = Trie.size(balances);
    totalReputation = Trie.fold(balances, 0, func(k, v, acc) { acc + v });
    recentAwards = recentAwards;
    recentRevokes = recentRevokes;
    activeAwarders = Trie.size(trustedAwarders);
  }
};
```

### Awarder Statistics

```motoko
public query func awarderStats(awarder : Principal) : async ?AwarderStats {
  switch (Trie.find(trustedAwarders, keyPrincipal(awarder), Principal.equal)) {
    case null { null };
    case (?info) {
      var totalAwarded = 0;
      var totalRevoked = 0;
      
      for (tx in transactions.vals()) {
        if (tx.from == awarder) {
          switch (tx.txType) {
            case (#award) { totalAwarded += tx.amount };
            case (#revoke) { totalRevoked += tx.amount };
            case _ {};
          };
        };
      };
      
      ?{
        awarder = awarder;
        displayName = info.displayName;
        totalAwarded = totalAwarded;
        totalRevoked = totalRevoked;
        dailyLimit = info.dailyLimit;
      }
    };
  };
};
```

## State Management

### Stable Variables

```motoko
stable var owner : Principal = installOwner;
stable var factory : Principal = installFactory;
stable var paused : Bool = false;
stable var dailyMintLimit : Nat = 1000;
stable var decayConfig : DecayConfig = defaultDecayConfig;
stable var transactions : [Transaction] = [];
stable var nextTxId : Nat = 0;
```

### Upgrade Hooks

```motoko
system func preupgrade() {
  // Convert tries to arrays
  stableBalances := Trie.toArray(balances, func(k, v) { (k, v) });
  stableAwarders := Trie.toArray(trustedAwarders, func(k, v) { (k, v) });
  stableBlacklist := Trie.toArray(blacklist, func(k, v) { (k, v) });
};

system func postupgrade() {
  // Rebuild tries from arrays
  for ((principal, balance) in stableBalances.vals()) {
    balances := Trie.put(balances, keyPrincipal(principal), Principal.equal, balance).0;
  };
  
  for ((principal, info) in stableAwarders.vals()) {
    trustedAwarders := Trie.put(trustedAwarders, keyPrincipal(principal), Principal.equal, info).0;
  };
  
  for ((principal, entry) in stableBlacklist.vals()) {
    blacklist := Trie.put(blacklist, keyPrincipal(principal), Principal.equal, entry).0;
  };
};
```

## Best Practices

### Reputation Management

1. **Validation**: Always validate amounts and principals
2. **Limits**: Enforce daily limits to prevent abuse
3. **Logging**: Record all reputation changes
4. **Blacklist**: Monitor and blacklist abusive users

### Decay Configuration

1. **Testing**: Test decay parameters before enabling
2. **Grace Period**: Allow time for users to earn reputation
3. **Threshold**: Set minimum balance to avoid micro-decay
4. **Monitoring**: Track decay impact on user engagement

### Access Control

1. **Owner Only**: Restrict sensitive operations to owner
2. **Pause**: Implement emergency pause mechanism
3. **Transfer**: Use two-step ownership transfer
4. **Validation**: Verify caller identity in all updates

## Next Steps

### 🏭 [Factory Contract](/docs/smart-contracts/factory)
Learn about factory canister implementation

### 🔄 [Upgrade Strategy](/docs/smart-contracts/upgrades)
Understand upgrade patterns and state migration

### 🧪 [Testing](/docs/smart-contracts/testing)
Test child canister functionality

### 🔧 [Child API](/docs/api/child)
Explore the complete API reference
