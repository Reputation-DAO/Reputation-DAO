# Getting Support

Need help with Reputation DAO? This guide covers all available support channels and resources.

## Quick Links

### Immediate Help

- **Telegram**: [@reputationdao](https://t.me/reputationdao) - Fastest response
- **GitHub Issues**: [Report bugs](https://github.com/Reputation-DAO/Reputation-DAO/issues)
- **Documentation**: [Search docs](/docs)

### Scheduled Support

- **Office Hours**: Weekly drop-in sessions (Telegram announcements)
- **Onboarding Calls**: Every third Thursday
- **Workshops**: Bi-weekly technical sessions

## Support Channels

### Telegram Community

**Channel**: [@reputationdao](https://t.me/reputationdao)

**Best For:**
- Quick questions
- Troubleshooting
- Community discussions
- Event announcements
- Real-time help

**Response Time**: Usually within hours during business hours

**Guidelines:**
- Search chat history first
- Be specific about your issue
- Share error messages and logs
- Tag relevant people if urgent

### GitHub Issues

**Repository**: [Reputation-DAO/Reputation-DAO](https://github.com/Reputation-DAO/Reputation-DAO/issues)

**Best For:**
- Bug reports
- Feature requests
- Technical issues
- Documentation errors

**Response Time**: 2-3 business days

**How to Report:**

```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**
1. Deploy canister
2. Call awardRep with...
3. Observe error...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- DFX version: 0.27.0
- Network: local/mainnet
- OS: macOS/Linux/Windows

**Logs**
```
Error message here
```

**Screenshots**
If applicable
```

### GitHub Discussions

**Link**: [Discussions](https://github.com/Reputation-DAO/Reputation-DAO/discussions)

**Best For:**
- General questions
- Architecture discussions
- Feature ideas
- Best practices
- Community projects

**Response Time**: 3-5 business days

**Categories:**
- Q&A: Ask questions
- Ideas: Propose features
- Show and Tell: Share projects
- General: Everything else

### Email Support

**General**: hello@reputationdao.dev

**Security**: security@reputationdao.dev

**Partnerships**: partnerships@reputationdao.dev

**Response Time**: 3-5 business days

## Common Issues

### Installation & Setup

#### DFX Installation Fails

**Problem**: `dfx` command not found after installation

**Solution:**
```bash
# Add to PATH
echo 'export PATH="$HOME/.local/share/dfx/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
dfx --version
```

#### Port Already in Use

**Problem**: Port 4943 is already bound

**Solution:**
```bash
# Stop existing replica
dfx stop

# Start fresh
dfx start --background --clean
```

#### Node Version Mismatch

**Problem**: Frontend build fails with Node.js errors

**Solution:**
```bash
# Use Node 18+
nvm install 18
nvm use 18

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

#### Canister Creation Fails

**Problem**: `createChildForOwner` returns error

**Solution:**
```bash
# Check WASM is uploaded
dfx canister call factoria getDefaultChildWasm

# If null, upload WASM
dfx build reputation_dao
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/reputation_dao_wasm.arg').write_text(f'(blob "{arg}")')
PY

dfx canister call factoria setDefaultChildWasm \
  --argument-file /tmp/reputation_dao_wasm.arg
```

#### Out of Cycles

**Problem**: Canister operations fail due to low cycles

**Solution:**
```bash
# Check cycles balance
dfx canister status <canister_id>

# Top up from factory
dfx canister call factoria topUpChild \
  "(principal \"<child_id>\", 1_000_000_000_000:nat)"
```

#### Upgrade Fails

**Problem**: Canister upgrade fails with state error

**Solution:**
```bash
# Check stable memory usage
dfx canister info <canister_id>

# If too large, clean up old data
dfx canister call <child_id> cleanupOldTransactions

# Try upgrade again
dfx canister install <child_id> --mode upgrade
```

### Frontend Issues

#### Wallet Connection Fails

**Problem**: Plug/II wallet won't connect

**Solution:**
1. Check `.env` file has correct canister IDs
2. Ensure local replica is running: `dfx ping`
3. Clear browser cache and cookies
4. Try incognito/private mode
5. Update wallet extension

#### Data Not Loading

**Problem**: Dashboard shows loading state indefinitely

**Solution:**
```typescript
// Check browser console for errors
// Verify canister IDs in .env
// Test canister directly:
dfx canister call <child_id> health

// Check network in browser DevTools
// Verify CORS settings
```

#### Build Errors

**Problem**: `npm run build` fails

**Solution:**
```bash
# Clear cache
rm -rf node_modules .vite dist
npm install

# Check for TypeScript errors
npm run type-check

# Fix linting issues
npm run lint -- --fix

# Try build again
npm run build
```

### Reputation Operations

#### Award Fails

**Problem**: `awardRep` returns "Not authorized"

**Solution:**
```bash
# Check if caller is trusted awarder
dfx canister call <child_id> getTrustedAwarders

# Add awarder if missing
dfx canister call <child_id> addTrustedAwarder \
  "(principal \"<awarder>\", \"Display Name\")"
```

#### Daily Limit Exceeded

**Problem**: "Daily limit exceeded" error

**Solution:**
```bash
# Check current limits
dfx canister call <child_id> getDailyMintLimit
dfx canister call <child_id> getPerAwarderDailyLimit \
  "(principal \"<awarder>\")"

# Increase if needed (owner only)
dfx canister call <child_id> setDailyMintLimit "(2000:nat)"
```

#### Blacklist Issues

**Problem**: User can't receive reputation

**Solution:**
```bash
# Check if blacklisted
dfx canister call <child_id> isBlacklisted \
  "(principal \"<user>\")"

# Remove from blacklist (owner only)
dfx canister call <child_id> blacklist \
  "(principal \"<user>\", false)"
```

## FAQ

### General Questions

**Q: Is Reputation DAO free to use?**

A: Yes, the protocol is open source. You only pay for Internet Computer cycles (gas fees).

**Q: Can I use this for my DAO/community?**

A: Absolutely! That's what it's built for. Follow the [Getting Started](/docs/getting-started) guide.

**Q: Is reputation transferable?**

A: No, reputation is soulbound and cannot be transferred between users.

**Q: Can I customize the decay settings?**

A: Yes, organization owners can configure decay rate, interval, threshold, and grace period.

### Technical Questions

**Q: What programming languages are supported?**

A: Backend is Motoko, frontend is TypeScript/React. CLI is TypeScript.

**Q: Can I integrate with my existing app?**

A: Yes! Use the TypeScript SDK or CLI. See [Frontend Integration](/docs/guides/frontend-integration).

**Q: How do I backup my data?**

A: Export transactions and balances via API. See [Upgrade Strategy](/docs/smart-contracts/upgrades).

**Q: What's the maximum number of users?**

A: Limited by canister memory (~4GB stable memory). Thousands of users per organization.

### Security Questions

**Q: How secure is my reputation data?**

A: Very secure. Uses IC cryptography, role-based access control, and audit trails. See [Security Model](/docs/security/model).

**Q: What if my admin key is compromised?**

A: Use two-step ownership transfer and emergency pause. See [Best Practices](/docs/security/best-practices).

**Q: How do I report a security issue?**

A: Email security@reputationdao.dev. See [Disclosure Policy](/docs/security/disclosure).

## Troubleshooting Guide

### Step-by-Step Debugging

#### 1. Verify Environment

```bash
# Check DFX version
dfx --version  # Should be 0.27.0

# Check Node version
node --version  # Should be 18+

# Check replica status
dfx ping
```

#### 2. Check Canister Status

```bash
# Get canister info
dfx canister info <canister_id>

# Check health
dfx canister call <child_id> health

# View logs
dfx canister logs <canister_id>
```

#### 3. Test Connectivity

```bash
# Test factory
dfx canister call factoria listChildren

# Test child
dfx canister call <child_id> getBalance \
  "(principal \"$(dfx identity get-principal)\")"
```

#### 4. Review Logs

```bash
# Backend logs
dfx canister logs <canister_id>

# Frontend logs
# Check browser console (F12)

# CLI logs
# Check terminal output
```

#### 5. Isolate the Issue

- Test on local replica first
- Try with different identity
- Test with minimal example
- Check recent changes

### Getting More Help

If you're still stuck:

1. **Gather Information:**
   - Error messages
   - Steps to reproduce
   - Environment details
   - Relevant logs

2. **Search Existing Issues:**
   - GitHub issues
   - Telegram chat history
   - Documentation

3. **Ask for Help:**
   - Telegram for quick help
   - GitHub for detailed issues
   - Email for private matters

## Office Hours

### Weekly Drop-In Sessions

**When**: Announced in Telegram

**Format**: Open Q&A and troubleshooting

**Topics:**
- Technical support
- Architecture questions
- Best practices
- Code reviews

**How to Join:**
- Watch for Telegram announcements
- No registration required
- Bring your questions

## Training & Workshops

### Smart Contract Workshops

**Cadence**: Bi-weekly

**Topics:**
- Motoko development
- Canister architecture
- Testing strategies
- Upgrade patterns

**Registration**: Announced in Telegram

### Frontend Workshops

**Cadence**: Monthly

**Topics:**
- React integration
- TypeScript SDK
- UI components
- State management

**Registration**: Announced in Telegram

### Community Onboarding

**Cadence**: Every third Thursday

**Topics:**
- Platform overview
- Organization setup
- Best practices
- Q&A

**Registration**: Announced in Telegram

## Enterprise Support

For organizations needing dedicated support:

### Features

- **Priority Support**: Faster response times
- **Dedicated Channel**: Private Telegram/Discord
- **Custom SLAs**: Guaranteed response times
- **Training Sessions**: Customized workshops
- **Architecture Review**: Expert consultation
- **Migration Support**: Help moving to production

### Contact

**Email**: partnerships@reputationdao.dev

**Include:**
- Organization name
- Use case description
- Support requirements
- Timeline

## Feedback

Help us improve our support:

- **Documentation**: Suggest improvements via GitHub
- **Support Quality**: Share feedback in Telegram
- **Feature Requests**: Open GitHub discussions
- **Bug Reports**: File GitHub issues

## Next Steps

### 📚 [Documentation](/docs)
Search the complete documentation

### 🤝 [Contributing](/docs/community/contributing)
Contribute to the project

### 💬 [Community Resources](/docs/community/resources)
Join the community

### 🚀 [Getting Started](/docs/getting-started)
Start building with Reputation DAO
