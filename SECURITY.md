# Security Policy

Reputation DAO is committed to keeping our canisters, frontend, and community assets safe for every organization that deploys the protocol. This document explains which releases we support, how to report vulnerabilities, and the guardrails we ask researchers to follow when testing the platform.

## Supported Versions

| Version / Branch | Status | Notes |
| --- | --- | --- |
| `main` (rolling) | ✅ Supported | Receives security and feature updates continuously. |
| Tagged releases `>= v1.0.0` | ✅ Supported | Patch releases are backported for critical fixes. |
| Tagged releases `< v1.0.0` | ⚠️ Maintenance only | Updates provided case-by-case; please upgrade. |
| Unreleased forks or custom deployments | ❌ Not supported | We cannot evaluate downstream modifications. |

> To request extended support for a bespoke deployment, contact the security team before you go live so we can align on responsibilities and timelines.

## Reporting a Vulnerability

- Email `security@reputationdao.dev` with a clear subject line such as `SECURITY: <summary>`.
- For sensitive reports, request our PGP key in your email so we can share the latest fingerprint or alternative secure channel.
- We strongly prefer private disclosure via email, but you may also open a private GitHub security advisory if email delivery fails.
- Please include:
  - A concise description of the issue and potential impact.
  - Steps to reproduce, scripts, PoCs, or screenshots.
  - Affected components (e.g., `factoria` canister, `reputation_dao` child, frontend).
  - Network context (`local`, `playground`, or `ic` mainnet) and canister IDs if applicable.
  - Any temporary mitigations you recommend.

We acknowledge new reports within **2 business days**. We aim to provide a remediation plan within **7 calendar days**, and to deploy validated fixes within **30 days**. If a fix requires coordination with downstream operators, we will keep you updated until closure.

## Coordinated Disclosure Guidelines

We ask researchers to:

- Make a good-faith effort to avoid privacy violations, data destruction, or service degradation.
- Limit testing to assets we control:
  - Motoko canisters in this repository (`factoria`, `reputation_dao`, `blog_backend`).
  - The official frontend hosted from this repository.
  - Scripts and deployment tooling inside this repo.
- Use test identities on `local` or `playground` networks whenever possible. Mainnet testing should be non-destructive and capped to minimal cycle spend.
- Provide us a reasonable time window to remediate before public disclosure. If you believe an issue is actively exploited, indicate the urgency in your first message.
- Refrain from:
  - Social engineering of maintainers or community members.
  - Automated scanning that floods canisters with traffic or drains cycles.
  - Attempting to access other organizations' child canisters without explicit permission.
  - Exfiltrating more data than necessary to demonstrate impact.

## Out of Scope

The following are considered out of scope for this policy:

- Bugs in third-party wallets (Plug, Stoic, Internet Identity) or libraries we depend on.
- Non-security bugs such as UI/UX issues or minor validation gaps.
- Findings that require a rooted device, compromised keys, or malicious browser extensions.
- Denial-of-service attacks that rely on overwhelming cycle consumption, unless you can demonstrate a resource exhaustion bug inside our code.
- Self-inflicted configuration errors in community deployments that deviate from the documented setup.

## Disclosure Handling

Once a verified issue is fixed, we will:

1. Notify the reporter with remediation details and credit preference.
2. Publish a changelog entry that summarizes the impact, affected versions, and mitigations.
3. Tag a patched release and, when necessary, coordinate with operators to redeploy canisters.
4. Update documentation and tests to prevent regressions.

If a report is invalid or duplicates an existing ticket, we will share that status and our reasoning. We welcome follow-up questions and additional evidence.

## Security Enhancements & Roadmap

We are actively working on:

- Continuous integration checks for linting, Motoko compilation, and frontend builds before merger.
- Automated regression suites for critical canister flows (award, revoke, decay, cycle management).
- Playbook updates covering incident response, secret rotation, and cycle monitoring.
- A community disclosure program that recognizes high-impact reports once we have the operational capacity to run it responsibly.

Thank you for helping keep Reputation DAO secure and trustworthy for every organization that relies on it.
