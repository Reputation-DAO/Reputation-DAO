# Installation Guide

Complete installation guide for Reputation DAO development environment.

## System Requirements

### Operating Systems

- **macOS** - 10.15 (Catalina) or later
- **Linux** - Ubuntu 20.04+, Debian 10+, or equivalent
- **Windows** - WSL2 (Windows Subsystem for Linux)

### Hardware

- **CPU** - 2+ cores recommended
- **RAM** - 4GB minimum, 8GB recommended
- **Disk** - 10GB free space
- **Network** - Stable internet connection

## Prerequisites

### 1. DFX (Internet Computer SDK)

Install DFX version 0.27.0:

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

Verify installation:

```bash
dfx --version
# Output: dfx 0.27.0
```

**Troubleshooting:**

If you have a different version:

```bash
dfx upgrade --version 0.27.0
```

If DFX is not in PATH:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 2. Node.js and npm

We recommend Node.js 18 or later.

#### Using nvm (Recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Install Node.js 18
nvm install 22
nvm use 22
nvm alias default 22
```

#### Using Package Manager

**macOS (Homebrew):**

```bash
brew install node@18
```

**Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**

```bash
node --version  # Should be v18.x.x or later
npm --version   # Should be 9.x.x or later
```

### 3. Python 3

Required for helper scripts.

**macOS:**

```bash
brew install python3
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

**Verify:**

```bash
python3 --version  # Should be 3.7 or later
```

### 4. Git

**macOS:**

```bash
brew install git
```

**Ubuntu/Debian:**

```bash
sudo apt-get install git
```

**Verify:**

```bash
git --version
```

### 5. Wallet (Optional but Recommended)

For testing the frontend:

- **Plug Wallet** - [Download](https://plugwallet.ooo/)
- **Stoic Wallet** - [Download](https://www.stoicwallet.com/)
- **Internet Identity** - Built into IC

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Reputation-DAO/Reputation-Dao.git
cd Reputation-Dao
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs all required packages including:
- React and React Router
- Tailwind CSS and UI components
- DFX agent libraries
- Development tools

**Expected output:**

```bash
added 873 packages in 45s
```

### 3. Return to Root

```bash
cd ..
```

## Local Development Setup

### 1. Start Local Replica

```bash
dfx start --background --clean
```

**Flags explained:**
- `--background` - Runs in background
- `--clean` - Wipes previous state

**Verify replica is running:**

```bash
dfx ping
```

**Expected output:**

```json
{
  "certified_height": 0,
  "ic_api_version": "0.18.0",
  "impl_hash": "...",
  "impl_version": "0.27.0",
  "replica_health_status": "healthy",
  "root_key": [...]
}
```

### 2. Deploy Canisters

```bash
dfx deploy --network local
```

This deploys:
- `factoria` - Factory canister
- `reputation_dao` - Child template
- `blog_backend` - Blog CMS
- `frontend` - Asset canister

**Expected output:**

```bash
Deploying all canisters.
Creating canisters...
...
URLs:
  Frontend canister via browser
    frontend: http://127.0.0.1:4943/?canisterId=...
```

### 3. Build and Upload Child WASM

```bash
# Build the child canister
dfx build reputation_dao

# Generate WASM argument file
python3 - <<'PY'
from pathlib import Path
wasm_path = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm')
wasm_bytes = wasm_path.read_bytes()
arg = ''.join('\\%02x' % b for b in wasm_bytes)
output_path = Path('/tmp/reputation_dao_wasm.arg')
output_path.write_text(f'(blob "{arg}")')
print(f'✓ Wrote {output_path} ({len(wasm_bytes):,} bytes)')
PY

# Upload to factory
dfx canister call factoria setDefaultChildWasm \
  --argument-file /tmp/reputation_dao_wasm.arg
```

**Expected output:**

```bash
✓ Wrote /tmp/reputation_dao_wasm.arg (1,234,567 bytes)
(variant { ok })
```

### 4. Create Your First Organization

```bash
# Get your principal
OWNER=$(dfx identity get-principal)
echo "Your principal: $OWNER"

# Create a child canister
dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"My First DAO\")"
```

**Expected output:**

```
(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")
```

**Save this principal!** You'll need it for the frontend configuration.

### 5. Configure Frontend Environment

```bash
# Copy template
cp frontend/env.example frontend/.env

# Edit the file
nano frontend/.env  # or use your preferred editor
```

**Required values:**

```env
VITE_IC_HOST=http://127.0.0.1:4943
VITE_FACTORIA_CANISTER_ID=<output of: dfx canister id factoria>
VITE_REPUTATION_DAO_CANISTER_ID=<child principal from step 4>
VITE_BLOG_BACKEND_CANISTER_ID=<output of: dfx canister id blog_backend>
VITE_FRONTEND_CANISTER_ID=<output of: dfx canister id frontend>
```

**Quick fill script:**

```bash
cat > frontend/.env <<EOF
VITE_IC_HOST=http://127.0.0.1:4943
VITE_FACTORIA_CANISTER_ID=$(dfx canister id factoria)
VITE_REPUTATION_DAO_CANISTER_ID=<PASTE_CHILD_ID_HERE>
VITE_BLOG_BACKEND_CANISTER_ID=$(dfx canister id blog_backend)
VITE_FRONTEND_CANISTER_ID=$(dfx canister id frontend)
EOF
```

### 6. Start Development Server

```bash
cd frontend
npm run dev
```

**Expected output:**

```
  VITE v5.4.19  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Visit [http://localhost:5173](http://localhost:5173)

## Verification

### Test Factory

```bash
# List children
dfx canister call factoria listChildren

# Get factory stats
dfx canister call factoria getFactoryStats
```

### Test Child Canister

Replace `<CHILD_ID>` with your child canister principal:

```bash
# Award reputation
dfx canister call <CHILD_ID> awardRep \
  "(principal \"$(dfx identity get-principal)\", 10:nat, opt \"Welcome bonus\")"

# Check balance
dfx canister call <CHILD_ID> getBalance \
  "(principal \"$(dfx identity get-principal)\")"

# View leaderboard
dfx canister call <CHILD_ID> leaderboard
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

### Port Already in Use

**Problem:** `Error: Address already in use`

**Solution:**

```bash
# Stop existing replica
dfx stop

# Start fresh
dfx start --background --clean
```

### DFX Version Mismatch

**Problem:** `dfx.json requires version 0.27.0`

**Solution:**

```bash
dfx upgrade --version 0.27.0
```

### Node Version Issues

**Problem:** `Error: Unsupported Node.js version`

**Solution:**

```bash
nvm install 22
nvm use 22
```

### Frontend Won't Connect

**Problem:** Wallet connection fails

**Solutions:**

1. Check `.env` file has correct IDs
2. Verify replica is running: `dfx ping`
3. Clear browser cache
4. Reconnect wallet
5. Check browser console for errors

### WASM Upload Fails

**Problem:** `setDefaultChildWasm` returns error

**Solutions:**

1. Verify WASM exists:
   ```bash
   ls -lh .dfx/local/canisters/reputation_dao/reputation_dao.wasm
   ```

2. Check argument file:
   ```bash
   head -c 100 /tmp/reputation_dao_wasm.arg
   ```

3. Ensure factory has cycles:
   ```bash
   dfx canister status factoria
   ```

### Python Script Fails

**Problem:** Python script errors

**Solution:**

```bash
# Ensure Python 3 is default
python3 --version

# Install required packages
pip3 install pathlib
```

## Windows (WSL2) Setup

### 1. Install WSL2

```powershell
# In PowerShell (Admin)
wsl --install
```

### 2. Install Ubuntu

```powershell
wsl --install -d Ubuntu-22.04
```

### 3. Follow Linux Instructions

Once in WSL2, follow the Ubuntu/Debian instructions above.

### 4. Access Files

Windows files are at `/mnt/c/Users/YourName/`

WSL files are at `\\wsl$\Ubuntu-22.04\home\yourname\`

## macOS Specific

### Xcode Command Line Tools

Required for some dependencies:

```bash
xcode-select --install
```

### Homebrew

If not installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Next Steps

### 🚀 [Quick Start](/docs/getting-started)
Get up and running quickly with the quick start guide

### 📖 [First Organization](/docs/guides/first-org)
Deploy your first DAO step-by-step

### 📚 [Core Concepts](/docs/concepts/overview)
Understand the architecture and design

### 🌐 [Deploy to Mainnet](/docs/deployment/mainnet)
Production deployment guide

## Additional Resources

- [DFX Documentation](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Node.js Documentation](https://nodejs.org/docs/)
- [WSL2 Setup Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Troubleshooting Guide](/docs/guides/troubleshooting)

## Getting Help

If you encounter issues:

1. Check this installation guide
2. Review [Common Issues](#common-issues)
3. Search [GitHub Issues](https://github.com/Reputation-DAO/Reputation-Dao/issues)
4. Ask in [Discord](https://discord.gg/reputation-dao)
5. Open a new issue with:
   - Operating system and version
   - DFX version (`dfx --version`)
   - Node version (`node --version`)
   - Error messages
   - Steps to reproduce
