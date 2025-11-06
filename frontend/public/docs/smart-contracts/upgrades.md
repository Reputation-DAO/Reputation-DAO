# Upgrade Strategy

Reputation DAO uses stable memory and upgrade hooks to preserve state across canister upgrades.

## Upgrade Process

### 1. Build the Child Canister

```bash
dfx build reputation_dao
```

### 2. Generate WASM Argument

```bash
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/reputation_dao_wasm.arg').write_text(f'(blob "{arg}")')
print(f'Wrote /tmp/reputation_dao_wasm.arg ({len(wasm)} bytes)')
PY
```

### 3. Upload to Factory

```bash
dfx canister call factoria setDefaultChildWasm \
  --argument-file /tmp/reputation_dao_wasm.arg
```

### 4. Upgrade Child Canisters

```bash
# Stop the canister
dfx canister stop <child_id>

# Upgrade with new WASM
dfx canister install <child_id> \
  --mode upgrade \
  --wasm .dfx/local/canisters/reputation_dao/reputation_dao.wasm

# Start the canister
dfx canister start <child_id>
```

### 5. Verify Upgrade

```bash
dfx canister call <child_id> health
dfx canister call <child_id> getBalance "(principal \"<user>\")"
```

## Stable Memory

### Factory Stable Variables

```motoko
stable var defaultChildWasm : ?Blob = null;
stable var stableChildren : [ChildRecord] = [];
stable var totalCyclesReceived : Nat = 0;
stable var globalAdmin : Principal = installAdmin;
```

### Child Stable Variables

```motoko
stable var owner : Principal = installOwner;
stable var factory : Principal = installFactory;
stable var paused : Bool = false;
stable var dailyMintLimit : Nat = 1000;
stable var decayConfig : DecayConfig = defaultDecayConfig;
stable var transactions : [Transaction] = [];
stable var nextTxId : Nat = 0;
```

## Upgrade Hooks

### Preupgrade Hook

```motoko
system func preupgrade() {
  stableBalances := Trie.toArray(balances, func(k, v) { (k, v) });
  stableAwarders := Trie.toArray(trustedAwarders, func(k, v) { (k, v) });
  Debug.print("Preupgrade: serialized state");
};
```

### Postupgrade Hook

```motoko
system func postupgrade() {
  for ((principal, balance) in stableBalances.vals()) {
    balances := Trie.put(balances, keyPrincipal(principal), Principal.equal, balance).0;
  };
  stableBalances := [];
  Debug.print("Postupgrade: restored state");
};
```

## State Migration

### Adding New Fields

```motoko
type AwarderInfo = {
  principal : Principal;
  displayName : Text;
  addedAt : Int;
  dailyLimit : ?Nat; // New optional field
};
```

### Version Tracking

```motoko
stable var version : Nat = 1;

system func postupgrade() {
  version += 1;
  Debug.print("Upgraded to version " # Nat.toText(version));
};
```

## Testing Upgrades

```bash
# Deploy initial version
dfx deploy reputation_dao

# Award reputation
dfx canister call reputation_dao awardRep \
  "(principal \"<user>\", 100:nat, opt \"test\")"

# Upgrade
dfx build reputation_dao
dfx canister install reputation_dao --mode upgrade

# Verify state preserved
dfx canister call reputation_dao getBalance "(principal \"<user>\")"
```

## Rollback Procedures

### Backup Before Upgrade

```bash
dfx canister call <child_id> getTransactionsPaged "(0, 1000)" > backup.json
cp .dfx/local/canisters/reputation_dao/reputation_dao.wasm backups/v1.wasm
```

### Rollback

```bash
dfx canister stop <child_id>
dfx canister install <child_id> --mode upgrade --wasm backups/v1.wasm
dfx canister start <child_id>
```

## Best Practices

### Before Upgrade
- Test locally first
- Backup state
- Tag WASM version
- Review changes

### During Upgrade
- Pause canister if needed
- Monitor cycles
- Staged rollout

### After Upgrade
- Verify state
- Test functionality
- Monitor logs
- Be ready to rollback

## Next Steps

### 🏭 [Factory Contract](/docs/smart-contracts/factory)
Factory canister implementation

### 🔧 [Child Contract](/docs/smart-contracts/child)
Child canister architecture

### 🧪 [Testing](/docs/smart-contracts/testing)
Test upgrade procedures
