# CLI Commands

Complete reference for all `repdao` CLI commands.

## Global Options

All commands support these options:

| Option | Description | Example |
|--------|-------------|---------|
| `--network` | Network to use (ic, local) | `--network local` |
| `--host` | Custom API host | `--host https://ic0.app` |
| `--pem` | Identity PEM file | `--pem ./admin.pem` |
| `--help` | Show command help | `repdao awardRep --help` |

## Identity Commands

### id:list

List all available identities (repdao + dfx).

```bash
repdao id:list
```

### id:new

Create a new secp256k1 identity.

```bash
repdao id:new <name>
```

Example:
```bash
repdao id:new alice
```

### id:use

Switch to a different identity.

```bash
repdao id:use <name>
```

Example:
```bash
repdao id:use alice
```

### id:import

Import an existing PEM file.

```bash
repdao id:import <name> <pem_path>
```

Example:
```bash
repdao id:import bob ./bob.pem
```

### id:export

Export an identity to a PEM file.

```bash
repdao id:export <name> <output_path>
```

Example:
```bash
repdao id:export alice ./alice.pem
```

### id:sync

Sync all dfx identities into repdao.

```bash
repdao id:sync
```

### id:whoami

Print the active principal.

```bash
repdao id:whoami
```

## Reputation Commands

### awardRep

Award reputation to a user.

```bash
repdao awardRep <child_id> <principal> <amount> [--reason <text>]
```

Example:
```bash
repdao awardRep rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" 100 \
  --reason "Excellent contribution"
```

### multiAward

Award reputation to multiple users in one transaction.

```bash
repdao multiAward <child_id> --pairs <json> [--atomic]
```

Example:
```bash
repdao multiAward rrkah-fqaaa-aaaaa-aaaaq-cai \
  --pairs '[
    ["2vxsx-fae", 25, "docs"],
    ["aaaaa-aa", 15, "review"]
  ]' \
  --atomic
```

### revokeRep

Revoke reputation from a user.

```bash
repdao revokeRep <child_id> <principal> <amount> [--reason <text>]
```

Example:
```bash
repdao revokeRep rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" 50 \
  --reason "Policy violation"
```

### resetUser

Reset a user's reputation to zero.

```bash
repdao resetUser <child_id> <principal> [--reason <text>]
```

Example:
```bash
repdao resetUser rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" \
  --reason "User requested reset"
```

## Awarder Management

### addTrustedAwarder

Add a trusted awarder to the organization.

```bash
repdao addTrustedAwarder <child_id> <principal> <display_name>
```

Example:
```bash
repdao addTrustedAwarder rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" \
  "Alice Admin"
```

### removeTrustedAwarder

Remove an awarder from the organization.

```bash
repdao removeTrustedAwarder <child_id> <principal>
```

Example:
```bash
repdao removeTrustedAwarder rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae"
```

### setPerAwarderDailyLimit

Set daily reputation limit for a specific awarder.

```bash
repdao setPerAwarderDailyLimit <child_id> <principal> <limit>
```

Example:
```bash
repdao setPerAwarderDailyLimit rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" 100
```

## Policy Configuration

### setDailyMintLimit

Set the organization-wide daily mint limit.

```bash
repdao setDailyMintLimit <child_id> <limit>
```

Example:
```bash
repdao setDailyMintLimit rrkah-fqaaa-aaaaa-aaaaq-cai 1000
```

### configureDecay

Configure reputation decay settings.

```bash
repdao configureDecay <child_id> <rate> <interval> <threshold> <grace> <enabled>
```

Parameters:
- `rate`: Decay rate (basis points, e.g., 500 = 5%)
- `interval`: Decay interval in seconds (e.g., 2592000 = 30 days)
- `threshold`: Minimum balance for decay (e.g., 10)
- `grace`: Grace period in seconds
- `enabled`: true or false

Example:
```bash
repdao configureDecay rrkah-fqaaa-aaaaa-aaaaq-cai \
  500 2592000 10 2592000 true
```

### blacklist

Add or remove a user from the blacklist.

```bash
repdao blacklist <child_id> <principal> <true|false>
```

Example:
```bash
# Add to blacklist
repdao blacklist rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae" true

# Remove from blacklist
repdao blacklist rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae" false
```

### pause

Pause or unpause the canister.

```bash
repdao pause <child_id> <true|false>
```

Example:
```bash
# Pause
repdao pause rrkah-fqaaa-aaaaa-aaaaq-cai true

# Unpause
repdao pause rrkah-fqaaa-aaaaa-aaaaq-cai false
```

### transferOwnership

Transfer ownership to a new principal.

```bash
repdao transferOwnership <child_id> <new_owner>
```

Example:
```bash
repdao transferOwnership rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae"
```

### processBatchDecay

Manually trigger batch decay processing.

```bash
repdao processBatchDecay <child_id>
```

Example:
```bash
repdao processBatchDecay rrkah-fqaaa-aaaaa-aaaaq-cai
```

## Analytics & Queries

### getBalance

Get a user's reputation balance.

```bash
repdao getBalance <child_id> <principal>
```

Example:
```bash
repdao getBalance rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae"
```

### getBalanceWithDetails

Get detailed balance information including decay.

```bash
repdao getBalanceWithDetails <child_id> <principal>
```

Example:
```bash
repdao getBalanceWithDetails rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae"
```

### leaderboard

Get the reputation leaderboard.

```bash
repdao leaderboard <child_id> <limit> <offset>
```

Example:
```bash
# Top 10 users
repdao leaderboard rrkah-fqaaa-aaaaa-aaaaq-cai 10 0

# Next 10 users
repdao leaderboard rrkah-fqaaa-aaaaa-aaaaq-cai 10 10
```

### orgPulse

Get organization statistics and metrics.

```bash
repdao orgPulse <child_id> <hours>
```

Example:
```bash
# Last 24 hours
repdao orgPulse rrkah-fqaaa-aaaaa-aaaaq-cai 24
```

### getTransactionsPaged

Get paginated transaction history.

```bash
repdao getTransactionsPaged <child_id> <offset> <limit>
```

Example:
```bash
repdao getTransactionsPaged rrkah-fqaaa-aaaaa-aaaaq-cai 0 25
```

### findTransactionsByReason

Find transactions by reason text.

```bash
repdao findTransactionsByReason <child_id> <reason> <limit>
```

Example:
```bash
repdao findTransactionsByReason rrkah-fqaaa-aaaaa-aaaaq-cai "docs" 10
```

### awarderStats

Get statistics for a specific awarder.

```bash
repdao awarderStats <child_id> <principal>
```

Example:
```bash
repdao awarderStats rrkah-fqaaa-aaaaa-aaaaq-cai "2vxsx-fae"
```

### health

Get canister health status.

```bash
repdao health <child_id>
```

Example:
```bash
repdao health rrkah-fqaaa-aaaaa-aaaaq-cai
```

## Cycles Management

### topUp

Top up a canister with cycles.

```bash
repdao topUp <child_id>
```

Example:
```bash
repdao topUp rrkah-fqaaa-aaaaa-aaaaq-cai
```

### withdrawCycles

Withdraw cycles from a canister.

```bash
repdao withdrawCycles <child_id> <vault_principal> <amount>
```

Example:
```bash
repdao withdrawCycles rrkah-fqaaa-aaaaa-aaaaq-cai \
  "2vxsx-fae" 25000000000
```

## Event Management

### emitEvent

Emit a custom event.

```bash
repdao emitEvent <child_id> <category> <message> [--b64 <data>] [--hex <data>]
```

Examples:
```bash
# Text event
repdao emitEvent rrkah-fqaaa-aaaaa-aaaaq-cai \
  maintenance "cleared cache"

# Binary event (base64)
repdao emitEvent rrkah-fqaaa-aaaaa-aaaaq-cai \
  metrics --b64 ZGF0YQ==

# Binary event (hex)
repdao emitEvent rrkah-fqaaa-aaaaa-aaaaq-cai \
  metrics --hex 64617461
```

## Output Format

All commands return JSON output. Use `jq` for parsing:

```bash
# Pretty print
repdao getBalance <child_id> <principal> | jq

# Extract specific field
repdao leaderboard <child_id> 10 0 | jq '.entries[0].principal'

# Save to file
repdao orgPulse <child_id> 24 > stats.json
```

## Next Steps

### 🔧 [CLI Overview](/docs/cli/overview)
Learn about CLI features

### ⚙️ [CLI Configuration](/docs/cli/configuration)
Set up identity and network settings

### 🔧 [Child API](/docs/api/child)
Explore the underlying canister API
