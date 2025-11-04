# CLI Configuration

Configure the `repdao` CLI for your workflow with identity management, network settings, and environment variables.

## Configuration Overview

The CLI uses a combination of:
- Identity store (`~/.repdao`)
- Environment variables
- Command-line flags
- DFX integration

## Identity Store

The CLI maintains identities in `~/.repdao/identities/` as secp256k1 PEM files.

### Directory Structure

```bash
~/.repdao/
├── identities/
│   ├── default.pem
│   ├── alice.pem
│   └── bob.pem
└── config.json
```

### Active Identity

The active identity is stored in `~/.repdao/config.json`:

```json
{
  "currentIdentity": "alice"
}
```

Switch identities:

```bash
repdao id:use alice
```

## Environment Variables

### REPDAO_NETWORK

Set the default network (ic, local, or custom alias).

```bash
# Mainnet
export REPDAO_NETWORK=ic

# Local replica
export REPDAO_NETWORK=local

# Custom network
export REPDAO_NETWORK=staging
```

### REPDAO_PEM

Override the active identity with a specific PEM file.

```bash
export REPDAO_PEM=/path/to/admin.pem
```

This is useful for CI/CD pipelines or scripts that need a specific identity.

### REPDAO_HOST

Set a custom API host.

```bash
# Custom gateway
export REPDAO_HOST=https://ic0.app

# Local replica
export REPDAO_HOST=http://127.0.0.1:4943
```

### DFX_NETWORK

If `REPDAO_NETWORK` is not set, the CLI falls back to `DFX_NETWORK`.

```bash
export DFX_NETWORK=local
```

## Command-Line Overrides

Flags always take precedence over environment variables.

### Network Override

```bash
repdao getBalance <child_id> <principal> --network local
```

### Host Override

```bash
repdao getBalance <child_id> <principal> --host https://ic0.app
```

### Identity Override

```bash
repdao awardRep <child_id> <principal> 100 --pem ./admin.pem
```

## Network Configuration

### Mainnet (ic)

Default host: `https://icp-api.io`

```bash
export REPDAO_NETWORK=ic
```

### Local Replica

Default host: `http://127.0.0.1:4943`

Automatically fetches the root key for local development.

```bash
export REPDAO_NETWORK=local
dfx start --background
```

### Custom Networks

Define custom networks with host overrides:

```bash
# Staging environment
export REPDAO_NETWORK=staging
export REPDAO_HOST=https://staging.example.com
```

## DFX Integration

### Sync Identities

Copy all dfx identities into the repdao store:

```bash
repdao id:sync
```

This creates PEM files in `~/.repdao/identities/` for each dfx identity.

### Use DFX Identity

If no repdao identity is configured, the CLI falls back to the current dfx identity:

```bash
dfx identity use alice
repdao id:whoami
# Uses alice from dfx
```

### Import DFX Identity

Manually import a specific dfx identity:

```bash
repdao id:import alice ~/.config/dfx/identity/alice/identity.pem
```

## Configuration Best Practices

### Development

Use local network and default identity:

```bash
export REPDAO_NETWORK=local
repdao id:use default
```

### Production

Use mainnet with a dedicated admin identity:

```bash
export REPDAO_NETWORK=ic
repdao id:use production-admin
```

### CI/CD

Use environment variables for identity and network:

```bash
export REPDAO_NETWORK=ic
export REPDAO_PEM=/secrets/deploy.pem
repdao awardRep <child_id> <principal> 100
```

### Multi-Organization

Create separate identities for each organization:

```bash
repdao id:new org1-admin
repdao id:new org2-admin

# Switch between them
repdao id:use org1-admin
repdao awardRep <org1_child_id> <principal> 100

repdao id:use org2-admin
repdao awardRep <org2_child_id> <principal> 100
```

## Security Considerations

### PEM File Permissions

Ensure PEM files have restricted permissions:

```bash
# macOS/Linux
chmod 600 ~/.repdao/identities/*.pem

# Windows
icacls %USERPROFILE%\.repdao\identities\*.pem /inheritance:r /grant:r "%USERNAME%:R"
```

### Environment Variables

Avoid storing PEM paths in shell history:

```bash
# Use a config file instead
echo "export REPDAO_PEM=/path/to/admin.pem" >> ~/.bashrc.local
source ~/.bashrc.local
```

### Separate Identities

Use different identities for different environments:

- `dev-admin` - Local development
- `staging-admin` - Staging environment
- `prod-admin` - Production mainnet

### Backup Identities

Regularly backup your identity store:

```bash
# macOS/Linux
tar -czf repdao-identities-backup.tar.gz ~/.repdao/identities/

# Windows
Compress-Archive -Path $env:USERPROFILE\.repdao\identities -DestinationPath repdao-identities-backup.zip
```

## Troubleshooting

### Identity Not Found

If the CLI can't find an identity:

1. List available identities:
```bash
repdao id:list
```

2. Create or import the identity:
```bash
repdao id:new myidentity
# or
repdao id:import myidentity ./myidentity.pem
```

### Network Connection Issues

If commands fail with network errors:

1. Check the host:
```bash
echo $REPDAO_HOST
```

2. Test connectivity:
```bash
curl $REPDAO_HOST/api/v2/status
```

3. Try a different host:
```bash
repdao getBalance <child_id> <principal> --host https://ic0.app
```

### Permission Denied

If you get permission errors accessing PEM files:

```bash
# Fix permissions
chmod 600 ~/.repdao/identities/*.pem
```

### Cache Issues

If actors are cached incorrectly:

1. Restart the CLI
2. Use a different host with a query parameter:
```bash
repdao getBalance <child_id> <principal> --host "http://127.0.0.1:4943?refresh=1"
```

## Configuration Examples

### Local Development

```bash
# ~/.bashrc or ~/.zshrc
export REPDAO_NETWORK=local
export REPDAO_HOST=http://127.0.0.1:4943

# Use default identity
repdao id:use default
```

### Production Deployment

```bash
# ~/.bashrc or ~/.zshrc
export REPDAO_NETWORK=ic
export REPDAO_HOST=https://icp-api.io

# Use production identity
repdao id:use prod-admin
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
env:
  REPDAO_NETWORK: ic
  REPDAO_PEM: ${{ secrets.DEPLOY_PEM }}

steps:
  - name: Award reputation
    run: |
      echo "$REPDAO_PEM" > /tmp/deploy.pem
      export REPDAO_PEM=/tmp/deploy.pem
      repdao awardRep $CHILD_ID $PRINCIPAL 100
```

## Next Steps

### 🔧 [CLI Overview](/docs/cli/overview)
Learn about CLI features

### 📖 [CLI Commands](/docs/cli/commands)
Explore all available commands

### 🚀 [Getting Started](/docs/getting-started)
Set up your development environment
