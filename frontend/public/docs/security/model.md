# Security Model

Reputation DAO implements a multi-layered security model to protect reputation data and ensure system integrity.

## Security Architecture

### Defense in Depth

The system uses multiple security layers:

1. **Network Layer**: Internet Computer consensus and cryptography
2. **Canister Layer**: Access control and validation
3. **Application Layer**: Role-based permissions
4. **Data Layer**: Soulbound tokens and audit trails

### Trust Boundaries

```bash
┌─────────────────────────────────────┐
│         Factory Canister            │
│  - Global admin only                │
│  - WASM management                  │
│  - Cycles distribution              │
└─────────────────────────────────────┘
              │
              ├─────────────────────────┐
              │                         │
┌─────────────▼──────────┐   ┌──────────▼───────────┐
│   Child Canister 1     │   │  Child Canister 2    │
│  - Org admin only      │   │  - Org admin only    │
│  - Isolated state      │   │  - Isolated state    │
│  - Trusted awarders    │   │  - Trusted awarders  │
└────────────────────────┘   └──────────────────────┘
```

## Authentication

### Wallet-Based Authentication

Users authenticate via Internet Computer wallets:

- **Plug Wallet**: Browser extension with hardware wallet support
- **Internet Identity**: WebAuthn-based authentication
- **Stoic Wallet**: Mobile and desktop support

### Principal-Based Identity

All operations use Internet Computer principals:

```motoko
public shared(msg) func awardRep(
  recipient : Principal,
  amount : Nat,
  reason : ?Text
) : async Result.Result<Nat, Text> {
  // msg.caller is cryptographically verified
  if (not isTrustedAwarder(msg.caller)) {
    return #err("Not authorized");
  };
  // ... award logic
};
```

**Security Properties:**
- Principals are cryptographically derived from public keys
- Cannot be spoofed or forged
- Tied to wallet signatures
- Verified by IC consensus

## Authorization

### Role-Based Access Control

#### Global Admin (Factory)

The factory has one global admin with full control:

```motoko
stable var globalAdmin : Principal = installAdmin;

private func requireAdmin(caller : Principal) {
  if (caller != globalAdmin) {
    throw Error.reject("Unauthorized: admin only");
  };
};
```

**Permissions:**
- Upload child WASM
- Create child canisters
- Manage cycles
- Transfer global admin role

#### Organization Owner (Child)

Each child canister has one owner:

```motoko
stable var owner : Principal = installOwner;

private func requireOwner(caller : Principal) {
  if (caller != owner) {
    throw Error.reject("Unauthorized: owner only");
  };
};
```

**Permissions:**
- Add/remove trusted awarders
- Configure decay settings
- Set daily limits
- Pause canister
- Transfer ownership

#### Trusted Awarders

Awarders can mint reputation with limits:

```motoko
private func isTrustedAwarder(caller : Principal) : Bool {
  Option.isSome(Trie.find(trustedAwarders, keyPrincipal(caller), Principal.equal))
};
```

**Permissions:**
- Award reputation (within daily limits)
- Revoke reputation (within daily limits)
- View awarder statistics

**Restrictions:**
- Cannot modify settings
- Cannot add other awarders
- Subject to daily limits
- Cannot bypass blacklist

## Access Control Mechanisms

### Ownership Transfer

Two-step ownership transfer prevents accidents:

```motoko
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
```

### Emergency Pause

Owners can pause canisters in emergencies:

```motoko
stable var paused : Bool = false;

private func requireNotPaused() {
  if (paused) {
    throw Error.reject("Canister is paused");
  };
};

public shared(msg) func pause(shouldPause : Bool) : async Result.Result<(), Text> {
  requireOwner(msg.caller);
  paused := shouldPause;
  #ok()
};
```

### Blacklist Protection

Prevent abusive users from participating:

```motoko
private var blacklist : Trie.Trie<Principal, BlacklistEntry> = Trie.empty();

private func isBlacklisted(principal : Principal) : Bool {
  Option.isSome(Trie.find(blacklist, keyPrincipal(principal), Principal.equal))
};

// Check in all award operations
if (isBlacklisted(recipient)) {
  return #err("Recipient is blacklisted");
};
```

## Threat Model

### In Scope

**Threats We Protect Against:**

1. **Unauthorized Minting**: Only trusted awarders can mint
2. **Reputation Transfer**: Soulbound tokens prevent transfers
3. **Replay Attacks**: IC nonces prevent replay
4. **Impersonation**: Cryptographic principals prevent spoofing
5. **Data Tampering**: Immutable transaction history
6. **Denial of Service**: Rate limits and daily caps

### Out of Scope

**Threats Outside Our Control:**

1. **Wallet Compromise**: Users must secure their wallets
2. **Social Engineering**: Users must verify recipients
3. **Network Attacks**: IC consensus handles network security
4. **Browser Exploits**: Users must keep browsers updated
5. **Malicious Extensions**: Users must vet extensions

### Attack Scenarios

#### Scenario 1: Malicious Awarder

**Attack**: Trusted awarder tries to mint unlimited reputation

**Mitigation**:
- Daily mint limits (global and per-awarder)
- Transaction logging for audit
- Owner can remove awarder
- Blacklist prevents abuse

#### Scenario 2: Stolen Owner Key

**Attack**: Attacker gains access to owner's private key

**Mitigation**:
- Two-step ownership transfer (attacker can't immediately transfer)
- Transaction history shows suspicious activity
- Emergency pause can stop operations
- Factory admin can intervene

#### Scenario 3: Cycles Drain

**Attack**: Attacker tries to drain canister cycles

**Mitigation**:
- Only owner can withdraw cycles
- Cycles monitoring and alerts
- Factory can top up children
- Freezing threshold prevents shutdown

## Security Guarantees

### Soulbound Property

Reputation cannot be transferred:

```motoko
// NO transfer function exists
// Balances are bound to earning principals
private var balances : Trie.Trie<Principal, Nat> = Trie.empty();
```

**Guarantees:**
- Reputation stays with the earner
- Cannot be sold or traded
- Cannot be gifted or donated
- Reflects actual contributions

### Audit Trail

All operations are logged:

```motoko
stable var transactions : [Transaction] = [];

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
```

**Guarantees:**
- Complete transaction history
- Immutable once recorded
- Timestamped and ordered
- Queryable for audits

### State Isolation

Each organization has isolated state:

```motoko
// Each child canister has separate:
private var balances : Trie.Trie<Principal, Nat> = Trie.empty();
private var trustedAwarders : Trie.Trie<Principal, AwarderInfo> = Trie.empty();
private var transactions : [Transaction] = [];
```

**Guarantees:**
- No cross-org data leakage
- Independent access control
- Separate upgrade cycles
- Isolated failure domains

## Operational Safeguards

### Role Separation

```
Global Factory Admin
  ├─ Manages WASM
  ├─ Creates children
  └─ Distributes cycles

Organization Owner
  ├─ Manages awarders
  ├─ Configures policy
  └─ Monitors activity

Trusted Awarder
  ├─ Awards reputation
  └─ Views statistics
```

### Stable Backups

Registry metadata backed up via upgrade hooks:

```motoko
system func preupgrade() {
  stableChildren := Trie.toArray(byId, func(k, v) { v });
  stableBalances := Trie.toArray(balances, func(k, v) { (k, v) });
};

system func postupgrade() {
  // Restore from stable memory
  for (record in stableChildren.vals()) {
    byId := Trie.put(byId, keyPrincipal(record.id), Principal.equal, record).0;
  };
};
```

### Logging & Monitoring

```motoko
// Transaction logging
recordTransaction(#award, awarder, recipient, amount, reason);

// Event logging
emitEvent("maintenance", "cleared cache");

// Health monitoring
public query func health() : async HealthStatus {
  {
    paused = paused;
    cyclesBalance = Cycles.balance();
    totalUsers = Trie.size(balances);
    totalTransactions = transactions.size();
  }
};
```

### Cycles Monitoring

```motoko
public query func health() : async HealthStatus {
  {
    cyclesBalance = Cycles.balance();
    // Alert if below threshold
  }
};
```

## Security Checklist

### Deployment

- [ ] Verify controller principals
- [ ] Set appropriate cycles balance
- [ ] Configure freezing threshold
- [ ] Test emergency pause
- [ ] Document admin contacts

### Configuration

- [ ] Set reasonable daily limits
- [ ] Configure decay parameters
- [ ] Add trusted awarders carefully
- [ ] Test blacklist functionality
- [ ] Enable monitoring

### Operations

- [ ] Monitor cycles regularly
- [ ] Review transaction logs
- [ ] Audit awarder activity
- [ ] Test backup/restore
- [ ] Update documentation

### Incident Response

- [ ] Emergency pause procedure
- [ ] Owner key backup
- [ ] Factory admin contact
- [ ] Rollback plan
- [ ] Communication plan

## Next Steps

### 🔒 [Best Practices](/docs/security/best-practices)
Security best practices for deployment

### 📋 [Disclosure Policy](/docs/security/disclosure)
Report security vulnerabilities

### 🔍 [Audit Reports](/docs/security/audits)
Review security audit findings

### 🏗️ [Architecture](/docs/concepts/architecture)
Understand system architecture
