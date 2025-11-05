# Getting Started

Get Reputation DAO running locally in under 15 minutes.

## Orientation

### What is Reputation DAO?

Reputation DAO is a factory-powered reputation platform for the Internet Computer. It lets you mint organization-specific canisters that:

- Keep soulbound reputation ledgers per community
- Expose configurable governance controls (roles, decay, analytics)
- Run fully on-chain so data remains tamper-proof and auditable

### Why Choose Reputation DAO?

- **Operational Simplicity** – Provision managed org canisters with one command while the factory handles cycles, upgrades, and indexing.
- **Security by Design** – All reputation logic stays on-chain, eliminating centralized databases and manual reconciliation.
- **Scalable Multi-Tenancy** – Serve dozens or thousands of orgs through a repeatable template without sacrificing isolation.
- **Extensible Interfaces** – Use the React frontend, CLI, or SDK to integrate reputation signals into your own products.

## Prerequisites

Before you begin, ensure you have:

| Tool | Version | Purpose |
|------|---------|---------|
| **DFX** | 0.27.0 | Internet Computer SDK |
| **Node.js** | 18+ | Frontend development |
| **npm** | 9+ | Package management |
| **Python** | 3.x | Helper scripts |

### Install DFX

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

Verify installation:

```bash
dfx --version
# Should output: dfx 0.27.0
```

### Install Node.js

We recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 22
nvm use 22
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Reputation-DAO/Reputation-Dao.git
cd Reputation-Dao
```

### 2. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install
cd ..
```

Backend dependencies are managed by DFX automatically.

## Local Development

### 1. Start the Local Replica

```bash
dfx start --background --clean
```

The `--clean` flag wipes previous state for a fresh start.

### 2. Deploy Canisters

```bash
dfx deploy --network local
```

This deploys:
- `factoria` - Factory canister
- `reputation_dao` - Child canister template
- `blog_backend` - Blog CMS
- `frontend` - Asset canister

### 3. Upload Child WASM

The factory needs the compiled child canister WASM:

```bash
# Build the child canister
dfx build reputation_dao

# Generate the WASM argument file
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/reputation_dao_wasm.arg').write_text(f'(blob "{arg}")')
print(f'Wrote /tmp/reputation_dao_wasm.arg ({len(wasm)} bytes)')
PY

# Upload to factory
dfx canister call factoria setDefaultChildWasm \
  --argument-file /tmp/reputation_dao_wasm.arg
```

### 4. Create Your First Organization

```bash
# Get your principal
OWNER=$(dfx identity get-principal)

# Create a child canister
dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"My First DAO\")"
```

Save the returned canister ID - you'll need it for the frontend.

### 5. Configure the Frontend

```bash
# Copy the environment template
cp frontend/env.example frontend/.env
```

Edit `frontend/.env` with your canister IDs:

```env
VITE_IC_HOST=http://127.0.0.1:4943
VITE_FACTORIA_CANISTER_ID=<dfx canister id factoria>
VITE_REPUTATION_DAO_CANISTER_ID=<child canister id from step 4>
VITE_BLOG_BACKEND_CANISTER_ID=<dfx canister id blog_backend>
VITE_FRONTEND_CANISTER_ID=<dfx canister id frontend>
```

### 6. Start the Development Server

```bash
cd frontend
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) and connect with:
- **Plug Wallet** (recommended)
- **Stoic Wallet**
- **Internet Identity**

## Verify Installation

### Test the Factory

```bash
# List all children
dfx canister call factoria listChildren

# Get child details
dfx canister call factoria getChild "(principal \"<child_id>\")"
```

### Test the Child Canister

```bash
# Award reputation
dfx canister call <child_id> awardRep \
  "(principal \"<user_principal>\", 10:nat, opt \"Welcome bonus\")"

# Check balance
dfx canister call <child_id> getBalance \
  "(principal \"<user_principal>\")"

# View leaderboard
dfx canister call <child_id> leaderboard
```

### Run Test Scripts

```bash
# Comprehensive factory test
./factoria_test.sh

# Child canister tests
./test_factoria_child.sh

# Multi-org scenarios
./test_multi_org_fixed.sh
```

## Common Issues

### DFX Version Mismatch

**Problem:** `dfx.json` requires version 0.27.0

**Solution:**
```bash
dfx upgrade --version 0.27.0
```

### Port Already in Use

**Problem:** Port 4943 is already bound

**Solution:**
```bash
dfx stop
dfx start --background --clean
```

### Frontend Can't Connect

**Problem:** Wallet connection fails

**Solution:**
1. Check `.env` file has correct canister IDs
2. Ensure local replica is running: `dfx ping`
3. Clear browser cache and reconnect wallet

### WASM Upload Fails

**Problem:** `setDefaultChildWasm` returns an error

**Solution:**
1. Verify the WASM file exists: `ls -lh .dfx/local/canisters/reputation_dao/reputation_dao.wasm`
2. Check the argument file: `head /tmp/reputation_dao_wasm.arg`
3. Ensure you have enough cycles in the factory

## Next Steps

### 📚 [Core Concepts](/docs/concepts/overview)
Understand the architecture and key concepts

### 📖 [Deploy Your First Org](/docs/guides/first-org)
Step-by-step tutorial for creating your first organization

### 🔧 [Factory API](/docs/api/factory)
Explore factory canister methods

### ⚛️ [Frontend Integration](/docs/guides/frontend-integration)
Connect your React app to the canisters

## Additional Resources

- [Architecture Overview](/docs/concepts/architecture)
- [CLI Reference](/docs/cli/overview)
- [TypeScript SDK](/docs/sdk/overview)
- [Deployment Guide](/docs/deployment/mainnet)
