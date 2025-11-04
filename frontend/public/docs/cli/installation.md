# CLI Installation

Install the `repdao` CLI globally to manage your Reputation DAO canisters from the terminal.

## System Requirements

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | 18+ | Required for npm |
| **npm** | 9+ | Package manager |
| **DFX** | 0.27.0 | Optional, for identity sync |

## Install Globally

```bash
npm install -g repdao
```

Verify installation:

```bash
repdao --version
repdao --help
```

## Local Installation (Project-Specific)

If you prefer to install per project:

```bash
npm install --save-dev repdao
```

Then use via npx:

```bash
npx repdao --help
```

## Verify Installation

Check that the CLI is working:

```bash
# Show version
repdao --version

# List available commands
repdao --help

# Check identity
repdao id:whoami
```

## Updating

Update to the latest version:

```bash
npm update -g repdao
```

Check for updates:

```bash
npm outdated -g repdao
```

## Uninstall

Remove the CLI:

```bash
npm uninstall -g repdao
```

Your identity store (`~/.repdao`) will remain. Delete it manually if needed:

```bash
# macOS/Linux
rm -rf ~/.repdao

# Windows
rmdir /s %USERPROFILE%\.repdao
```

## Troubleshooting

### Permission Errors (macOS/Linux)

If you get permission errors during global install:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g repdao

# Option 2: Configure npm to use a different directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g repdao
```

### Command Not Found

If `repdao` is not found after installation:

1. Check npm global bin path:
```bash
npm config get prefix
```

2. Add to PATH:
```bash
# macOS/Linux
export PATH="$(npm config get prefix)/bin:$PATH"

# Windows (PowerShell)
$env:PATH += ";$(npm config get prefix)"
```

### Version Conflicts

If you have multiple Node.js versions:

```bash
# Use nvm to switch versions
nvm use 18
npm install -g repdao
```

## Next Steps

### 🔧 [CLI Overview](/docs/cli/overview)
Learn about CLI features and commands

### ⚙️ [CLI Configuration](/docs/cli/configuration)
Set up identity and network settings

### 📖 [CLI Commands](/docs/cli/commands)
Explore all available commands
