# Factory Smart Contract

The Factory canister (`src/factoria/main.mo`) is the central orchestrator that manages child canister lifecycle, cycles distribution, and WASM storage.

## Architecture Overview

The factory is a singleton canister that:
- Stores the canonical child WASM binary
- Creates and manages child canisters
- Distributes cycles to children
- Maintains registry indexes for fast lookups
- Enforces admin access control

## Core Responsibilities

### 1. WASM Vault

The factory stores the latest compiled child binary in stable memory.

```motoko
stable var defaultChildWasm : ?Blob = null;

public shared(msg) func setDefaultChildWasm(wasm : Blob) : async () {
  requireAdmin(msg.caller);
  defaultChildWasm := ?wasm;
};
```

**Key Points:**
- WASM is stored as a `Blob` in stable memory
- Only admins can update the WASM
- All new children use this WASM template
- Upgrades require uploading new WASM

### 2. Lifecycle Orchestration

The factory manages the complete lifecycle of child canisters.

#### Create Child

```motoko
public shared(msg) func createChildForOwner(
  owner : Principal,
  initialCycles : Nat,
  trustedAwarders : [Principal],
  orgName : Text
) : async Principal {
  // Validate WASM exists
  let wasm = switch (defaultChildWasm) {
    case null { throw Error.reject("No WASM") };
    case (?w) { w };
  };
  
  // Create canister with cycles
  let childId = await IC.create_canister({
    settings = ?{
      controllers = ?[Principal.fromActor(this)];
      compute_allocation = null;
      memory_allocation = null;
      freezing_threshold = null;
    }
  });
  
  // Install WASM
  await IC.install_code({
    mode = #install;
    canister_id = childId;
    wasm_module = wasm;
    arg = to_candid(owner, Principal.fromActor(this));
  });
  
  // Register in indexes
  registerChild(childId, owner, orgName);
  
  childId
};
```

#### Start/Stop/Delete

```motoko
public shared(msg) func startChild(childId : Principal) : async () {
  requireOrgAdmin(msg.caller, childId);
  await IC.start_canister({ canister_id = childId });
};

public shared(msg) func stopChild(childId : Principal) : async () {
  requireOrgAdmin(msg.caller, childId);
  await IC.stop_canister({ canister_id = childId });
};

public shared(msg) func deleteChild(childId : Principal) : async () {
  requireOrgAdmin(msg.caller, childId);
  await IC.delete_canister({ canister_id = childId });
  unregisterChild(childId);
};
```

### 3. Registry Indexes

The factory maintains three indexes for efficient lookups:

```motoko
// By canister ID
private var byId : Trie.Trie<Principal, ChildRecord> = Trie.empty();

// By owner principal
private var byOwner : Trie.Trie<Principal, [Principal]> = Trie.empty();

// Archived children
private var archived : [ChildRecord] = [];
```

**Index Operations:**

```motoko
public query func getChild(childId : Principal) : async ?ChildRecord {
  Trie.find(byId, keyPrincipal(childId), Principal.equal)
};

public query func listChildrenByOwner(owner : Principal) : async [Principal] {
  switch (Trie.find(byOwner, keyPrincipal(owner), Principal.equal)) {
    case null { [] };
    case (?children) { children };
  }
};

public query func listChildren() : async [ChildRecord] {
  Trie.toArray(byId, func(k, v) { v })
};
```

**Rebuild on Upgrade:**

```motoko
system func postupgrade() {
  // Rebuild indexes from stable data
  for (record in stableChildren.vals()) {
    byId := Trie.put(byId, keyPrincipal(record.id), Principal.equal, record).0;
    
    let existing = switch (Trie.find(byOwner, keyPrincipal(record.owner), Principal.equal)) {
      case null { [] };
      case (?arr) { arr };
    };
    byOwner := Trie.put(byOwner, keyPrincipal(record.owner), Principal.equal, Array.append(existing, [record.id])).0;
  };
};
```

### 4. Cycles Vault

The factory receives and distributes cycles to child canisters.

#### Receive Cycles

```motoko
public func wallet_receive() : async Nat {
  let available = Cycles.available();
  let accepted = Cycles.accept(available);
  totalCyclesReceived += accepted;
  accepted
};
```

#### Top Up Child

```motoko
public shared(msg) func topUpChild(childId : Principal, amount : Nat) : async () {
  requireOrgAdmin(msg.caller, childId);
  
  Cycles.add(amount);
  await IC.deposit_cycles({ canister_id = childId });
  
  logTopUp(childId, amount);
};
```

#### Return Cycles

```motoko
public shared(msg) func returnCyclesToFactory(amount : Nat) : async () {
  // Called by child canisters
  let available = Cycles.available();
  let accepted = Cycles.accept(Nat.min(available, amount));
  totalCyclesReceived += accepted;
};
```

### 5. Admin Model

The factory enforces two levels of access control:

#### Global Admin

```motoko
stable var globalAdmin : Principal = installAdmin;

private func requireAdmin(caller : Principal) {
  if (caller != globalAdmin) {
    throw Error.reject("Unauthorized: admin only");
  };
};

public shared(msg) func setGlobalAdmin(newAdmin : Principal) : async () {
  requireAdmin(msg.caller);
  globalAdmin := newAdmin;
};
```

#### Organization Admin

```motoko
private func requireOrgAdmin(caller : Principal, childId : Principal) {
  switch (Trie.find(byId, keyPrincipal(childId), Principal.equal)) {
    case null { throw Error.reject("Child not found") };
    case (?record) {
      if (caller != record.owner and caller != globalAdmin) {
        throw Error.reject("Unauthorized: org admin only");
      };
    };
  };
};
```

## State Management

### Stable Variables

```motoko
stable var defaultChildWasm : ?Blob = null;
stable var stableChildren : [ChildRecord] = [];
stable var stableArchived : [ChildRecord] = [];
stable var totalCyclesReceived : Nat = 0;
stable var globalAdmin : Principal = installAdmin;
```

### Upgrade Hooks

```motoko
system func preupgrade() {
  // Convert tries to arrays
  stableChildren := Trie.toArray(byId, func(k, v) { v });
  stableArchived := archived;
};

system func postupgrade() {
  // Rebuild tries from arrays
  for (record in stableChildren.vals()) {
    byId := Trie.put(byId, keyPrincipal(record.id), Principal.equal, record).0;
    // ... rebuild other indexes
  };
  archived := stableArchived;
};
```

## Data Structures

### ChildRecord

```motoko
type ChildRecord = {
  id : Principal;
  owner : Principal;
  orgName : Text;
  createdAt : Int;
  status : ChildStatus;
};

type ChildStatus = {
  #active;
  #stopped;
  #archived;
};
```

## Best Practices

### WASM Management

1. **Version Control**: Tag WASM uploads with version metadata
2. **Testing**: Test WASM thoroughly before uploading
3. **Backup**: Keep previous WASM versions for rollback
4. **Size Limits**: Monitor WASM size (max ~2MB for stable memory)

### Cycles Management

1. **Monitoring**: Track cycles balance regularly
2. **Thresholds**: Set up alerts for low cycles
3. **Top-ups**: Automate top-ups for critical children
4. **Budgeting**: Allocate cycles based on usage patterns

### Registry Maintenance

1. **Cleanup**: Archive inactive children regularly
2. **Validation**: Verify child status before operations
3. **Indexing**: Keep indexes synchronized with state
4. **Pagination**: Use pagination for large result sets

## Security Considerations

### Access Control

- Only global admin can update WASM
- Only org admin or global admin can manage children
- Validate caller identity in all update calls
- Use `shared(msg)` pattern for authentication

### Cycles Safety

- Validate cycles amounts before transfers
- Check available cycles before accepting
- Log all cycles operations for audit
- Implement rate limiting for top-ups

### State Integrity

- Validate all state transitions
- Use atomic operations for multi-step changes
- Implement rollback mechanisms
- Test upgrade paths thoroughly

## Monitoring & Debugging

### Health Checks

```motoko
public query func factoryHealth() : async {
  wasmLoaded : Bool;
  totalChildren : Nat;
  totalArchived : Nat;
  cyclesBalance : Nat;
} {
  {
    wasmLoaded = Option.isSome(defaultChildWasm);
    totalChildren = Trie.size(byId);
    totalArchived = archived.size();
    cyclesBalance = Cycles.balance();
  }
};
```

### Logging

```motoko
stable var operationLog : [LogEntry] = [];

type LogEntry = {
  timestamp : Int;
  operation : Text;
  childId : ?Principal;
  caller : Principal;
};

private func logOperation(op : Text, child : ?Principal, caller : Principal) {
  let entry = {
    timestamp = Time.now();
    operation = op;
    childId = child;
    caller = caller;
  };
  operationLog := Array.append(operationLog, [entry]);
};
```

## Next Steps

### 🔧 [Child Contract](/docs/smart-contracts/child)
Learn about child canister implementation

### 🔄 [Upgrade Strategy](/docs/smart-contracts/upgrades)
Understand upgrade patterns and state migration

### 🧪 [Testing](/docs/smart-contracts/testing)
Test factory and child canisters

### 🔧 [Factory API](/docs/api/factory)
Explore the complete API reference
