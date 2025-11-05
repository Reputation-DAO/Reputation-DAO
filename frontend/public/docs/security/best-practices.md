# Security Best Practices

Essential security practices for deploying and operating Reputation DAO canisters safely.

## Deployment Security

### Controller Management

Controllers have full control over canisters. Manage them carefully.

#### Set Appropriate Controllers

```bash
# Check current controllers
dfx canister info <canister_id>

# Set controllers (factory should control children)
dfx canister update-settings <child_id> \
  --add-controller <factory_id> \
  --add-controller <backup_admin>
```

**Best Practices:**

✅ **Factory as Controller**: Factory should control all children

✅ **Backup Admin**: Add a backup admin principal

✅ **Hardware Wallet**: Use hardware wallet for admin keys

✅ **Multi-Sig**: Consider multi-signature for critical operations

❌ **Single Point of Failure**: Don't rely on one controller

❌ **Shared Keys**: Don't share admin keys

### Identity Management

Secure your admin identities:

```bash
# Create dedicated admin identity
dfx identity new production-admin

# Use hardware wallet
dfx identity new --hsm production-admin

# Export for backup (store securely!)
dfx identity export production-admin > admin-backup.pem
chmod 600 admin-backup.pem
```

**Storage:**

- Store PEM files in encrypted storage
- Use password managers for passphrases
- Keep offline backups in secure locations
- Never commit keys to version control

### Network Configuration

#### Mainnet Deployment

```bash
# Use mainnet network
dfx deploy --network ic

# Verify deployment
dfx canister --network ic info <canister_id>
```

#### Custom Networks

```json
// dfx.json
{
  "networks": {
    "staging": {
      "providers": ["https://staging.example.com"],
      "type": "persistent"
    }
  }
}
```

## Cycles Security

### Monitoring Cycles

Set up monitoring for cycles balance:

```bash
# Check cycles balance
dfx canister --network ic status <canister_id>

# Get detailed health
dfx canister call <child_id> health
```

**Thresholds:**

| Canister Type | Minimum | Warning | Critical |
|--------------|---------|---------|----------|
| Factory | 10T | 5T | 2T |
| Child | 5T | 2T | 1T |
| Blog | 1T | 500B | 100B |

### Automated Top-Ups

Set up automated cycles management:

```bash
# Top up from factory
dfx canister call factoria topUpChild \
  "(principal \"<child_id>\", 1_000_000_000_000:nat)"
```

**Automation Options:**

1. **Cron Jobs**: Schedule regular top-ups
2. **Monitoring Alerts**: Alert when cycles are low
3. **Auto Top-Up**: Implement automatic top-up logic
4. **Cycles Wallet**: Use cycles wallet for management

### Freezing Threshold

Configure freezing threshold to prevent shutdown:

```bash
dfx canister update-settings <canister_id> \
  --freezing-threshold 2592000  # 30 days
```

**Recommendations:**

- Factory: 30 days (2592000 seconds)
- Children: 30 days (2592000 seconds)
- Blog: 14 days (1209600 seconds)

## Access Control

### Owner Management

#### Secure Owner Transfer

Always use two-step ownership transfer:

```bash
# Step 1: Initiate transfer
dfx canister call <child_id> transferOwnership \
  "(principal \"<new_owner>\")"

# Step 2: New owner accepts
dfx canister call <child_id> acceptOwnership
```

**Benefits:**

- Prevents accidental transfers
- Requires new owner confirmation
- Allows cancellation before acceptance
- Provides audit trail

#### Owner Key Security

- Use hardware wallets for owner keys
- Store backup keys in secure locations
- Document key recovery procedures
- Test recovery process regularly

### Awarder Management

#### Adding Awarders

Be selective when adding trusted awarders:

```bash
# Add awarder with display name
dfx canister call <child_id> addTrustedAwarder \
  "(principal \"<awarder>\", \"Alice Admin\")"

# Set per-awarder limit
dfx canister call <child_id> setPerAwarderDailyLimit \
  "(principal \"<awarder>\", 100:nat)"
```

**Vetting Process:**

1. Verify identity of the awarder
2. Check their reputation in community
3. Start with low daily limits
4. Monitor their activity
5. Increase limits gradually

#### Monitoring Awarders

```bash
# Check awarder statistics
dfx canister call <child_id> awarderStats \
  "(principal \"<awarder>\")"

# Review recent transactions
dfx canister call <child_id> findTransactionsByReason \
  "(\"awarded by <awarder>\", 100)"
```

### Daily Limits

Set appropriate daily limits:

```bash
# Global daily limit
dfx canister call <child_id> setDailyMintLimit "(1000:nat)"

# Per-awarder limit
dfx canister call <child_id> setPerAwarderDailyLimit \
  "(principal \"<awarder>\", 50:nat)"
```

**Recommendations:**

| Organization Size | Global Limit | Per-Awarder Limit |
|------------------|--------------|-------------------|
| Small (<100) | 500 | 50 |
| Medium (100-1000) | 2000 | 100 |
| Large (>1000) | 5000 | 200 |

## Configuration Security

### Decay Configuration

Test decay settings before enabling:

```bash
# Configure decay (disabled initially)
dfx canister call <child_id> configureDecay \
  "(500:nat, 2592000:nat, 10:nat, 2592000:nat, false)"

# Test on local replica first
# Monitor impact on test users
# Enable gradually in production
```

**Safe Decay Parameters:**

- **Rate**: Start with 5% (500 basis points)
- **Interval**: 30 days (2592000 seconds)
- **Threshold**: 10 points minimum
- **Grace Period**: 30 days for new users

### Blacklist Management

Use blacklist judiciously:

```bash
# Add to blacklist with reason
dfx canister call <child_id> blacklist \
  "(principal \"<user>\", true)"

# Document reason in transaction log
dfx canister call <child_id> emitEvent \
  "(\"moderation\", \"Blacklisted <user> for spam\")"
```

**Process:**

1. Document the reason
2. Notify the user (if appropriate)
3. Review periodically
4. Provide appeal process
5. Remove when appropriate

### Emergency Pause

Use pause for emergencies only:

```bash
# Pause canister
dfx canister call <child_id> pause "(true)"

# Investigate issue
# Fix problem
# Resume operations

# Unpause canister
dfx canister call <child_id> pause "(false)"
```

**When to Pause:**

- Security incident detected
- Unexpected behavior observed
- Preparing for major upgrade
- Cycles critically low
- Legal or compliance issue

## Monitoring & Auditing

### Health Checks

Regular health monitoring:

```bash
# Check canister health
dfx canister call <child_id> health

# Expected output:
# {
#   paused = false;
#   cyclesBalance = 5_000_000_000_000;
#   totalUsers = 150;
#   totalTransactions = 1250;
# }
```

**Monitoring Schedule:**

- **Hourly**: Cycles balance
- **Daily**: Transaction volume
- **Weekly**: Awarder activity
- **Monthly**: Full audit

### Transaction Auditing

Review transaction history regularly:

```bash
# Get recent transactions
dfx canister call <child_id> getTransactionsPaged "(0, 100)"

# Find suspicious patterns
dfx canister call <child_id> findTransactionsByReason \
  "(\"suspicious\", 50)"

# Check specific user
dfx canister call <child_id> getBalanceWithDetails \
  "(principal \"<user>\")"
```

**Red Flags:**

- Unusual transaction volumes
- Repeated revocations
- Large single awards
- Off-hours activity
- Pattern changes

### Logging

Enable comprehensive logging:

```bash
# Emit custom events
dfx canister call <child_id> emitEvent \
  "(\"security\", \"Admin login from new IP\")"

# Review event log
dfx canister call <child_id> getEvents "(0, 100)"
```

**Log Categories:**

- **Security**: Authentication, authorization
- **Admin**: Configuration changes
- **Moderation**: Blacklist, pause
- **Cycles**: Top-ups, withdrawals
- **Errors**: Failed operations

## Incident Response

### Preparation

Have an incident response plan:

1. **Contact List**: Admin contacts and escalation
2. **Runbooks**: Step-by-step procedures
3. **Backup Keys**: Secure key storage
4. **Communication**: User notification templates
5. **Recovery**: Rollback and restore procedures

### Detection

Monitor for security incidents:

- Unusual transaction patterns
- Unexpected cycles drain
- Failed authentication attempts
- Configuration changes
- Performance anomalies

### Response

Follow incident response procedure:

```bash
# 1. Pause affected canister
dfx canister call <child_id> pause "(true)"

# 2. Assess the situation
dfx canister call <child_id> health
dfx canister call <child_id> getTransactionsPaged "(0, 1000)"

# 3. Contain the incident
# - Remove compromised awarders
# - Blacklist malicious users
# - Stop cycles drain

# 4. Investigate root cause
# - Review transaction logs
# - Check configuration changes
# - Analyze attack vectors

# 5. Remediate
# - Fix vulnerabilities
# - Restore from backup if needed
# - Update security controls

# 6. Resume operations
dfx canister call <child_id> pause "(false)"

# 7. Post-incident review
# - Document lessons learned
# - Update procedures
# - Communicate with users
```

### Recovery

Backup and recovery procedures:

```bash
# Backup state before changes
dfx canister call <child_id> getTransactionsPaged "(0, 10000)" > backup.json
dfx canister call <child_id> leaderboard "(10000, 0)" > leaderboard.json

# Test recovery on local replica
dfx start --clean
dfx deploy
# Restore data...

# Verify recovery
dfx canister call <child_id> health
```

## Upgrade Security

### Pre-Upgrade Checklist

Before upgrading:

- [ ] Test upgrade on local replica
- [ ] Backup current state
- [ ] Review code changes
- [ ] Check stable memory usage
- [ ] Verify cycles balance
- [ ] Notify users of maintenance
- [ ] Prepare rollback plan

### Upgrade Process

```bash
# 1. Pause canister (optional)
dfx canister call <child_id> pause "(true)"

# 2. Backup state
dfx canister call <child_id> getTransactionsPaged "(0, 10000)" > backup.json

# 3. Perform upgrade
dfx canister install <child_id> --mode upgrade \
  --wasm new_version.wasm

# 4. Verify upgrade
dfx canister call <child_id> health
dfx canister call <child_id> getVersion

# 5. Resume operations
dfx canister call <child_id> pause "(false)"
```

### Post-Upgrade Verification

```bash
# Verify state preserved
dfx canister call <child_id> getBalance "(principal \"<test_user>\")"

# Check functionality
dfx canister call <child_id> leaderboard "(10, 0)"

# Monitor for issues
dfx canister call <child_id> health
```

## Compliance & Privacy

### Data Protection

- Store minimal personal data
- Use principals (pseudonymous)
- Provide data export functionality
- Implement data retention policies
- Document data processing

### Regulatory Compliance

- Review applicable regulations (GDPR, CCPA, etc.)
- Implement required controls
- Maintain audit trails
- Provide user rights (access, deletion)
- Document compliance measures

## Security Checklist

### Initial Deployment

- [ ] Set appropriate controllers
- [ ] Configure freezing threshold
- [ ] Set daily limits
- [ ] Add trusted awarders
- [ ] Test emergency pause
- [ ] Document admin contacts
- [ ] Set up monitoring
- [ ] Create backup procedures

### Ongoing Operations

- [ ] Monitor cycles daily
- [ ] Review transactions weekly
- [ ] Audit awarders monthly
- [ ] Test backups quarterly
- [ ] Update documentation
- [ ] Train administrators
- [ ] Review security policies

### Incident Response

- [ ] Incident response plan
- [ ] Contact list updated
- [ ] Runbooks documented
- [ ] Recovery tested
- [ ] Communication templates
- [ ] Post-incident review process

## Next Steps

### 🔒 [Security Model](/docs/security/model)
Understand security architecture

### 📋 [Disclosure Policy](/docs/security/disclosure)
Report security vulnerabilities

### 🔍 [Audit Reports](/docs/security/audits)
Review security audit findings

### 🚀 [Mainnet Deployment](/docs/deployment/mainnet)
Deploy to production safely
