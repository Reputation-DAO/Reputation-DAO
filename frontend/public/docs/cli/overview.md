# CLI Reference

The `repdao` CLI wraps the same canister APIs as the SDK, adds identity management, and keeps you productive without juggling dfx commands. Install it once globally, point at your canisters, and script every lifecycle action from the terminal.

## Install & Quick Start

### Install Globally

```bash
npm i -g repdao
repdao --help
```

### Minimal Workflow

```bash
# Set network (defaults to ic)
export REPDAO_NETWORK=ic

# Point at a PEM if you don't want the built-in identity store
echo "REPDAO_PEM=/path/to/admin.pem" >> ~/.bashrc

# List commands
repdao help awardRep
```

Pass `--network` (ic, local, or any alias) and `--host` overrides per command if needed. Mainnet defaults to `https://icp-api.io`; local replicas hit `http://127.0.0.1:4943` and automatically fetch the root key.

## Identity Management

The CLI maintains a lightweight store under `~/.repdao` (secp256k1 PEM files). You can sync with your dfx identities or import PEMs manually.

```bash
repdao id:list                      # Show repdao + dfx identities
repdao id:new alice                 # Generate a new secp256k1 identity
repdao id:use alice                 # Switch current identity
repdao id:import bob ./bob.pem      # Import existing PEM
repdao id:export alice ./alice.pem  # Export identity
repdao id:sync                      # Copy all dfx identities into repdao
repdao id:whoami                    # Print the active principal
```

You can always override the active identity with `--pem` or `REPDAO_PEM` for a single command.

## Award & Moderation Flows

### Award Reputation

```bash
repdao awardRep <child_id> <principal> <amount> --reason "great work"
```

### Multi-Award (Batch)

```bash
repdao multiAward <child_id> \
  --pairs '[ ["<user>", 25, "docs"], ["<user2>", 15] ]' \
  --atomic
```

### Revoke Reputation

```bash
repdao revokeRep <child_id> <principal> <amount> --reason "spam"
```

### Reset User

```bash
repdao resetUser <child_id> <principal> --reason "requested"
```

All amounts are `Nat` and parsed as bigint. Optional strings map to Candid `opt text` automatically.

## Policy & Admin

### Manage Awarders

```bash
# Add trusted awarder
repdao addTrustedAwarder <child_id> <awarder_principal> "Display Name"

# Remove awarder
repdao removeTrustedAwarder <child_id> <awarder_principal>

# Set per-awarder daily limit
repdao setPerAwarderDailyLimit <child_id> <awarder_principal> 50
```

### Configure Limits

```bash
# Set daily mint limit
repdao setDailyMintLimit <child_id> 250
```

### Configure Decay

```bash
# Configure decay: rate, interval, threshold, grace period, enabled
repdao configureDecay <child_id> 500 2592000 10 2592000 true
```

### Moderation

```bash
# Blacklist user
repdao blacklist <child_id> <principal> true

# Pause canister
repdao pause <child_id> false

# Transfer ownership
repdao transferOwnership <child_id> <new_owner>
```

### Process Decay

```bash
repdao processBatchDecay <child_id>
```

Booleans accept `true`/`false`. The decay helper takes rate, interval, threshold, grace period, and enabled flag in sequence.

## Analytics & History

### Check Balances

```bash
# Simple balance
repdao getBalance <child_id> <principal>

# Balance with details
repdao getBalanceWithDetails <child_id> <principal>
```

### Leaderboard

```bash
# Get top 10 users, starting at offset 0
repdao leaderboard <child_id> 10 0
```

### Organization Pulse

```bash
repdao orgPulse <child_id> 0
```

### Transaction History

```bash
# Get paginated transactions
repdao getTransactionsPaged <child_id> 0 25

# Find by reason
repdao findTransactionsByReason <child_id> "docs" 10
```

### Awarder Statistics

```bash
repdao awarderStats <child_id> <principal>
```

### Health Check

```bash
repdao health <child_id>
```

Results are printed as JSON with bigint values converted to strings. Pipe the output to `jq` or redirect to a file when scripting dashboards.

## Cycles & DX Helpers

### Manage Cycles

```bash
# Top up canister
repdao topUp <child_id>

# Withdraw cycles
repdao withdrawCycles <child_id> <vault_principal> 25000000000
```

### Emit Events

```bash
# Text event
repdao emitEvent <child_id> maintenance "cleared cache"

# Binary event (base64)
repdao emitEvent <child_id> metrics --b64 ZGF0YQ==
```

Use `--b64` or `--hex` whenever your payload is non-textual. Events are stored by the canister and surfaced in admin dashboards.

## Troubleshooting

### Hosts & Networks

Pass `--host` for bespoke gateways. Non-mainnet networks automatically request the root key, but you can skip this by pre-setting `DFX_NETWORK`.

### Identity Overrides

`--pem` always wins. If nothing is configured, the CLI falls back to your current dfx identity (when available).

### Cache

Actors are cached per combination of canister, host, and principal. Restart the CLI or pass `--host` with a dummy query parameter to force a fresh agent during debugging.

## Next Steps

### 📖 [Getting Started](/docs/getting-started)
Set up your development environment

### 🔧 [Factory API](/docs/api/factory)
Explore the canister interfaces

### 📚 [Core Concepts](/docs/concepts/overview)
Understand the architecture
