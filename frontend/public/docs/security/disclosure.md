# Security Disclosure Policy

Our goal is to keep every organization's reputation data secure. This guide summarizes the disclosure workflow, supported releases, and operational safeguards.

## Supported Releases

We actively patch the rolling `main` branch and tagged releases at **v1.0.0 or newer**. Older tags receive fixes only for exceptional cases, so plan to upgrade when a new point release lands.

**Custom forks** are outside our support boundary—coordinate before you launch if you need tailored SLAs.

### Version Support Matrix

| Version | Supported | End of Support |
|---------|-----------|----------------|
| main (rolling) | ✅ Yes | Ongoing |
| v1.x.x | ✅ Yes | Until v2.0.0 |
| v0.x.x | ⚠️ Limited | Best effort only |
| Custom forks | ❌ No | Contact us |

## Reporting Vulnerabilities

We take security seriously and appreciate responsible disclosure.

### How to Report

**Email**: security@reputationdao.dev

**Subject Line**: Include a brief summary of the issue

**PGP Encryption**: Request our PGP key if you need to share sensitive proof-of-concept material

### What to Include

Please provide as much information as possible:

1. **Description**: Clear summary of the vulnerability
2. **Impact**: Potential damage or exploitation scenarios
3. **Affected Components**: Which canisters or modules are affected
4. **Network**: Where you observed the issue (local, testnet, mainnet)
5. **Reproduction Steps**: Detailed steps to reproduce
6. **Proof of Concept**: Code, screenshots, or logs (if applicable)
7. **Suggested Fix**: If you have ideas for remediation

### Example Report

```
Subject: Unauthorized reputation minting via race condition

Description:
A race condition in the multiAward function allows awarders to 
bypass daily limits by submitting multiple concurrent requests.

Impact:
Malicious awarders could mint unlimited reputation, breaking 
the economic model and trust in the system.

Affected Components:
- Child canister: multiAward function
- Daily limit enforcement logic

Network:
Observed on local replica, potentially affects mainnet

Reproduction Steps:
1. Configure per-awarder daily limit to 100
2. Submit 10 concurrent multiAward calls with 20 points each
3. Observe that all calls succeed, totaling 200 points

Proof of Concept:
[Attached test script]

Suggested Fix:
Use atomic counters or locks to prevent concurrent limit checks
```

## Response Timeline

We follow a structured response process:

### Initial Response

**Within 2 business days**: We acknowledge receipt of your report

### Investigation

**Within 7 calendar days**: We share a preliminary assessment and remediation plan

### Remediation

**Within 30 days**: We target production fixes depending on severity

**Severity Levels:**

| Severity | Response Time | Fix Target |
|----------|--------------|------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium | 7 days | 30 days |
| Low | 14 days | 60 days |

### Disclosure

**After Fix**: We coordinate public disclosure with you

**Credit**: We acknowledge your contribution (unless you prefer anonymity)

## Testing Guardrails

To ensure responsible testing, please follow these guidelines:

### Allowed Testing

✅ **Local Replica**: Test on your own local dfx replica

✅ **Playground Networks**: Use IC playground or test networks

✅ **Owned Canisters**: Test canisters you control

✅ **Non-Destructive**: Read-only queries and safe operations

### Prohibited Testing

❌ **Cycles Drain**: Don't drain cycles from production canisters

❌ **Spam Traffic**: Avoid excessive requests that impact service

❌ **Other Organizations**: Don't access other orgs' child canisters without consent

❌ **Social Engineering**: Don't manipulate users or admins

❌ **Privacy Violations**: Respect user data and privacy regulations

### Out of Scope

The following are outside our security scope:

- Rooted or jailbroken devices
- Malicious browser extensions
- Third-party wallet vulnerabilities
- Social engineering attacks
- Physical access attacks
- Denial of service (unless novel)
- Issues requiring user interaction with malicious content

## Disclosure Process

### 1. Report Received

- We acknowledge your report
- Assign a tracking ID
- Begin investigation

### 2. Validation

- Reproduce the issue
- Assess severity and impact
- Determine affected versions

### 3. Remediation

- Develop and test fix
- Prepare security advisory
- Coordinate with stakeholders

### 4. Release

- Deploy fix to production
- Release patched versions
- Update documentation

### 5. Public Disclosure

- Publish security advisory
- Credit researcher (if desired)
- Share lessons learned

### Coordinated Disclosure

We prefer coordinated disclosure:

- **Embargo Period**: Typically 90 days from report
- **Early Disclosure**: If actively exploited, we may disclose sooner
- **Researcher Input**: We coordinate timing with you
- **Public Credit**: We acknowledge your contribution

## Hall of Fame

We recognize security researchers who help us improve:

### 2024

*No reports yet - be the first!*

### Recognition

- Public acknowledgment in release notes
- Listed in security hall of fame
- Optional link to your profile/website
- Swag and rewards (for significant findings)

## Bug Bounty Program

**Status**: Coming soon

We're working on a formal bug bounty program with rewards for:

- Critical vulnerabilities: $1,000 - $5,000
- High severity: $500 - $1,000
- Medium severity: $100 - $500
- Low severity: Recognition + swag

Stay tuned for official launch details.

## Operational Safeguards

### Role Separation

- **Global Factory Admin**: Manages WASM and cycles
- **Organization Owners**: Control their child canisters
- **Trusted Awarders**: Limited reputation minting

### Stable Backups

Registry metadata backed up via `preupgrade`/`postupgrade` hooks:

```motoko
system func preupgrade() {
  stableChildren := Trie.toArray(byId, func(k, v) { v });
};

system func postupgrade() {
  for (record in stableChildren.vals()) {
    byId := Trie.put(byId, keyPrincipal(record.id), Principal.equal, record).0;
  };
};
```

### Logging

Sensitive operations logged through:

- Transaction history arrays
- Event logs for admin actions
- Cycles monitoring endpoints

### Monitoring

Health check endpoints:

```motoko
public query func health() : async HealthStatus {
  {
    paused = paused;
    cyclesBalance = Cycles.balance();
    totalUsers = Trie.size(balances);
    totalTransactions = transactions.size();
  }
};
```

### Incident Response

**Coming Soon:**
- CI enforcement for security checks
- Automated regression test suites
- Incident response playbook
- Security monitoring dashboard

Track progress in community updates.

## Contact Information

### Security Team

**Email**: security@reputationdao.dev

**PGP Key**: Request via email

**Response Time**: 2 business days

### General Support

**Discord**: Join our community server

**GitHub**: Report non-security issues

**Twitter**: Follow for updates

**Documentation**: You're here!

## Resources

### Documentation

- [SECURITY.md](https://github.com/Reputation-DAO/Reputation-Dao/blob/main/SECURITY.md) - Repository root
- [Security Model](/docs/security/model) - Security architecture
- [Best Practices](/docs/security/best-practices) - Deployment security
- [Audit Reports](/docs/security/audits) - Security audit findings

### API Reference

- [Factory API](/docs/api/factory) - Factory canister methods
- [Child API](/docs/api/child) - Child canister methods
- [CLI Reference](/docs/cli/overview) - Command-line tools

### Community

- [Contributing](/docs/community/contributing) - Contribution guidelines
- [Code of Conduct](/docs/community/code-of-conduct) - Community standards
- [Support](/docs/community/support) - Get help

## Legal

### Safe Harbor

We commit to:

- Not pursue legal action for good faith security research
- Work with you to understand and resolve issues
- Recognize your contribution publicly (if desired)

### Responsible Disclosure

By reporting vulnerabilities, you agree to:

- Give us reasonable time to fix issues
- Not publicly disclose until we've released a fix
- Not exploit vulnerabilities beyond proof of concept
- Follow our testing guardrails

## Updates

This policy may be updated periodically. Check back for changes.

**Last Updated**: November 4, 2025

**Version**: 1.0

## Next Steps

### 🔒 [Security Model](/docs/security/model)
Understand our security architecture

### 📋 [Best Practices](/docs/security/best-practices)
Security best practices for deployment

### 🔍 [Audit Reports](/docs/security/audits)
Review security audit findings

### 📧 Contact Us
Email: security@reputationdao.dev
