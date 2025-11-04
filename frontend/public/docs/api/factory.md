# Factory Canister API

Complete API reference for the Factory canister (`factoria`).

## Overview

The Factory canister orchestrates the creation and management of child reputation canisters. It maintains a cycles vault, tracks ownership, and provides lifecycle management for all child instances.

## Core Methods

### createChildForOwner

Creates a new child canister for an organization.

```motoko
public shared(msg) func createChildForOwner(
  owner: Principal,
  initialCycles: Nat,
  controllers: [Principal],
  notes: Text
) : async Principal
```

**Parameters:**
- `owner` - Principal who will own the child canister
- `initialCycles` - Initial cycles to allocate (minimum 1T)
- `controllers` - Additional controller principals
- `notes` - Metadata notes for the organization

**Returns:** Principal ID of the newly created child canister

**Example:**

```bash
dfx canister call factoria createChildForOwner \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai", 1_000_000_000_000:nat, vec {}, "My DAO")'
```

**TypeScript:**

```typescript
import { createChildForOwner } from 'repdao';

const childId = await createChildForOwner(
  ownerPrincipal,
  1_000_000_000_000n,
  [],
  'My DAO',
  { identity, network: 'ic' }
);
```

### listChildren

Returns all registered child canisters.

```motoko
public query func listChildren() : async [ChildInfo]
```

**Returns:** Array of child canister information

**Example:**

```bash
dfx canister call factoria listChildren
```

**Response:**

```candid
vec {
  record {
    id = principal "xxxxx-xxxxx-xxxxx-xxxxx-cai";
    owner = principal "yyyyy-yyyyy-yyyyy-yyyyy-cai";
    status = variant { Active };
    createdAt = 1_234_567_890 : nat64;
    notes = "My DAO";
  };
}
```

### getChild

Retrieves detailed information about a specific child.

```motoko
public query func getChild(childId: Principal) : async ?ChildInfo
```

**Parameters:**
- `childId` - Principal of the child canister

**Returns:** Optional child information

**Example:**

```bash
dfx canister call factoria getChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

## Lifecycle Management

### stopChild

Stops a running child canister.

```motoko
public shared(msg) func stopChild(childId: Principal) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to stop

**Authorization:** Must be factory admin or child owner

**Example:**

```bash
dfx canister call factoria stopChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

### startChild

Starts a stopped child canister.

```motoko
public shared(msg) func startChild(childId: Principal) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to start

**Example:**

```bash
dfx canister call factoria startChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

### archiveChild

Archives a child canister for potential reuse.

```motoko
public shared(msg) func archiveChild(childId: Principal) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to archive

**Note:** Archived children can be reassigned to new owners

**Example:**

```bash
dfx canister call factoria archiveChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

## Cycles Management

### topUpChild

Transfers cycles from the factory vault to a child canister.

```motoko
public shared(msg) func topUpChild(
  childId: Principal,
  amount: Nat
) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to top up
- `amount` - Number of cycles to transfer

**Example:**

```bash
dfx canister call factoria topUpChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai", 1_000_000_000:nat)'
```

### getTopUpHistory

Retrieves the top-up history for a child canister.

```motoko
public query func getTopUpHistory(childId: Principal) : async [TopUpRecord]
```

**Parameters:**
- `childId` - Principal of the child

**Returns:** Array of top-up records

**Example:**

```bash
dfx canister call factoria getTopUpHistory \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

## WASM Management

### setDefaultChildWasm

Uploads the canonical child canister WASM.

```motoko
public shared(msg) func setDefaultChildWasm(wasm: Blob) : async Result.Result<(), Text>
```

**Parameters:**
- `wasm` - Compiled WASM binary

**Authorization:** Factory admin only

**Example:**

```bash
# Generate WASM argument
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/wasm.arg').write_text(f'(blob "{arg}")')
PY

# Upload
dfx canister call factoria setDefaultChildWasm --argument-file /tmp/wasm.arg
```

### getDefaultChildWasmHash

Returns the hash of the current default WASM.

```motoko
public query func getDefaultChildWasmHash() : async ?Text
```

**Returns:** Optional SHA-256 hash of the WASM

**Example:**

```bash
dfx canister call factoria getDefaultChildWasmHash
```

## Upgrade Operations

### upgradeChild

Upgrades a child canister to the latest WASM.

```motoko
public shared(msg) func upgradeChild(
  childId: Principal,
  preserveState: Bool
) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to upgrade
- `preserveState` - Whether to preserve stable memory

**Example:**

```bash
dfx canister call factoria upgradeChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai", true)'
```

### reinstallChild

Reinstalls a child canister (wipes state).

```motoko
public shared(msg) func reinstallChild(childId: Principal) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child to reinstall

**Warning:** This operation wipes all data!

**Example:**

```bash
dfx canister call factoria reinstallChild \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

## Ownership Management

### transferChildOwnership

Initiates ownership transfer for a child canister.

```motoko
public shared(msg) func transferChildOwnership(
  childId: Principal,
  newOwner: Principal
) : async Result.Result<(), Text>
```

**Parameters:**
- `childId` - Principal of the child
- `newOwner` - Principal of the new owner

**Note:** Requires two-step confirmation

**Example:**

```bash
dfx canister call factoria transferChildOwnership \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai", principal "yyyyy-yyyyy-yyyyy-yyyyy-cai")'
```

## Query Methods

### getFactoryStats

Returns factory-wide statistics.

```motoko
public query func getFactoryStats() : async FactoryStats
```

**Returns:** Factory statistics including:
- Total children created
- Active children count
- Archived children count
- Total cycles distributed
- Factory cycles balance

**Example:**

```bash
dfx canister call factoria getFactoryStats
```

### getChildrenByOwner

Lists all children owned by a specific principal.

```motoko
public query func getChildrenByOwner(owner: Principal) : async [Principal]
```

**Parameters:**
- `owner` - Principal to query

**Returns:** Array of child canister principals

**Example:**

```bash
dfx canister call factoria getChildrenByOwner \
  '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")'
```

## Error Handling

All update methods return `Result<T, Text>` where:
- `#ok(value)` - Success
- `#err(message)` - Error with description

Common errors:
- `"Unauthorized"` - Caller lacks permission
- `"Child not found"` - Invalid child principal
- `"Insufficient cycles"` - Not enough cycles in vault
- `"Invalid state"` - Operation not allowed in current state

## Rate Limits

The factory implements rate limiting:
- Max 10 children per owner per hour
- Max 100 top-ups per child per day
- Max 1 WASM upload per hour

## Best Practices

1. **Cycles Management**
   - Monitor child cycles regularly
   - Set up automatic top-ups
   - Maintain adequate factory vault balance

2. **Upgrades**
   - Test upgrades on testnet first
   - Always preserve state unless intentional wipe
   - Backup critical data before upgrades

3. **Ownership**
   - Use hardware wallets for production
   - Rotate controllers regularly
   - Document ownership transfers

4. **Monitoring**
   - Track factory stats
   - Monitor top-up history
   - Alert on low cycles

## TypeScript SDK

The `repdao` package provides typed wrappers:

```typescript
import {
  createChildForOwner,
  listChildren,
  getChild,
  topUpChild,
  upgradeChild,
  getFactoryStats,
} from 'repdao';

// Create child
const childId = await createChildForOwner(
  ownerPrincipal,
  1_000_000_000_000n,
  [],
  'My DAO',
  { identity, network: 'ic' }
);

// List all children
const children = await listChildren({ network: 'ic' });

// Get specific child
const child = await getChild(childId, { network: 'ic' });

// Top up cycles
await topUpChild(childId, 1_000_000_000n, { identity, network: 'ic' });

// Get stats
const stats = await getFactoryStats({ network: 'ic' });
```

## See Also

- [Child Canister API](/docs/api/child)
- [TypeScript SDK](/docs/api/sdk)
- [Deployment Guide](/docs/deployment/mainnet)
- [Cycles Management](/docs/guides/cycles)
