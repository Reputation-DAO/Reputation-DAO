import { Link } from "react-router-dom";

const SecurityGuide = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        Security & Disclosure
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Our goal is to keep every organization’s reputation data secure. This guide summarises the disclosure workflow, supported releases, and operational safeguards described in <code>SECURITY.md</code>.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Supported Releases</h2>
      <p className="text-muted-foreground mb-4">
        We actively patch the rolling <code>main</code> branch and tagged releases at <code>v1.0.0</code> or newer. Older tags receive fixes only for exceptional cases, so plan to upgrade when a new point release lands.
      </p>
      <p className="text-muted-foreground">
        Custom forks are outside our support boundary—coordinate before you launch if you need tailored SLAs.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Reporting Vulnerabilities</h2>
      <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
        <li>Email <code>security@reputationdao.dev</code> with the issue summary in the subject.</li>
        <li>Request our PGP key if you need to share sensitive proof-of-concept material.</li>
        <li>Include reproduction steps, expected impact, affected components, and the network where you observed the issue.</li>
      </ol>
      <p className="text-muted-foreground mt-4">
        We acknowledge within two business days, share a remediation plan inside seven calendar days, and target production fixes within thirty days depending on severity.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Testing Guardrails</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Prefer <code>local</code> or <code>playground</code> networks when possible.</li>
        <li>Avoid draining cycles or spamming traffic; keep tests non-destructive on mainnet.</li>
        <li>Do not access other organizations' child canisters without written consent.</li>
        <li>Skip social-engineering and respect privacy regulations.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Findings that require rooted devices, malicious extensions, or unrelated third-party bugs fall outside scope.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Operational Safeguards</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Role separation between global factory admin and child organization owners.</li>
        <li>Stable backups of registry metadata via <code>preupgrade</code>/<code>postupgrade</code> hooks.</li>
        <li>Logging of sensitive operations through transaction history and event arrays.</li>
        <li>Cycle monitoring endpoints like <code>child.health</code> and <code>topUps</code> to detect anomalies.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Upcoming work includes CI enforcement, automated regression suites, and an incident playbook. Track progress in the <Link to="/docs/community" className="text-primary hover:underline">community updates</Link>.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Resources</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li><a href="/SECURITY.md" target="_blank" rel="noreferrer" className="text-primary hover:underline">SECURITY.md</a> (repository root)</li>
        <li><Link to="/docs/api" className="text-primary hover:underline">API Reference</Link> for lifecycle commands referenced in runbooks.</li>
        <li>Contact <code>security@reputationdao.dev</code> to coordinate embargoed disclosures.</li>
      </ul>
    </section>
  </div>
);

export default SecurityGuide;
