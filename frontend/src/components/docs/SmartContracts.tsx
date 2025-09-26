import { Link } from "react-router-dom";

const SmartContracts = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        Smart Contract Architecture
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Reputation DAO is composed of a factory canister that manages lifecycle and cycles, a child actor class that enforces soulbound balances with decay, and a lightweight blog backend. This guide explains how the pieces fit together and where to extend them.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Factory Canister (`src/factoria/main.mo`)</h2>
      <ul className="space-y-4 text-muted-foreground list-disc list-inside">
        <li><strong>Canonical WASM vault</strong> – stores the latest compiled child binary in stable memory via <code>setDefaultChildWasm</code>.</li>
        <li><strong>Lifecycle orchestration</strong> – creates, starts, stops, archives, and deletes child canisters while tracking logical ownership.</li>
        <li><strong>Registry indexes</strong> – maintains <code>byId</code>, <code>byOwner</code>, and an archived pool rebuilt on every upgrade to offer O(log n) lookups.</li>
        <li><strong>Cycles vault</strong> – receives deposits through <code>wallet_receive</code> and exposes <code>topUpChild</code> plus <code>returnCyclesToFactory</code> to keep tenants funded.</li>
        <li><strong>Admin model</strong> – enforces global admin and per-child owner roles through <code>requireAdmin</code> and <code>requireOrgAdmin</code>.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        The actor is a singleton; its principal is referenced in <code>dfx.json</code> and the frontend env variables.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Child Reputation Actor (`src/reputation_dao/main.mo`)</h2>
      <p className="text-muted-foreground mb-4">
        Each organization receives an isolated actor instance with the following capabilities:
      </p>
      <ul className="space-y-4 text-muted-foreground list-disc list-inside">
        <li><strong>Soulbound balances</strong> tracked in a <code>Trie</code> keyed by principal.</li>
        <li><strong>Trusted awarders</strong> with configurable per-day mint caps and a global pause switch.</li>
        <li><strong>Blacklist registry</strong> blocking abusive principals from earning or awarding reputation.</li>
        <li><strong>Decay engine</strong> with grace period, threshold, rate, and interval stored in stable state.</li>
        <li><strong>Transaction history</strong> and top-up logs appended in stable arrays with incrementing IDs.</li>
        <li><strong>Two-step ownership transfer</strong> support through <code>pendingOwner</code>.</li>
        <li><strong>Analytics endpoints</strong> such as <code>leaderboard</code>, <code>orgPulse</code>, and <code>awarderStats</code>.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        The actor class receives the initial owner and factory principals during installation. Upgrades preserve all stable structures.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Blog Backend (`src/blog_backend/main.mo`)</h2>
      <p className="text-muted-foreground">
        A minimal Motoko canister exposes CRUD operations for marketing posts. The frontend uses the generated declarations to pull featured content into the Blog page.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Upgrade Strategy</h2>
      <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
        <li>Build the child canister via <code>dfx build reputation_dao</code>.</li>
        <li>Generate the blob argument (<code>reputation_dao_wasm.arg</code>) and upload with <code>setDefaultChildWasm</code>.</li>
        <li>Call <code>factory.upgradeChild</code> (coming soon) or use <code>dfx canister install --mode upgrade</code> on each child.</li>
        <li>Verify with <code>child.health</code> to confirm paused state, cycles, and hash.</li>
      </ol>
      <p className="text-muted-foreground mt-4">
        The factory’s <code>preupgrade</code> and <code>postupgrade</code> hooks rebuild indexes so upgrades remain deterministic.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Extending the Protocol</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Add new analytics endpoints by appending to the <code>Transaction</code> or <code>Event</code> logs and exposing summary functions.</li>
        <li>Introduce new awarder roles by expanding the <code>trustedAwarders</code> data model.</li>
        <li>Integrate third-party scoring by piping updates through <code>multiAward</code> with atomic batches.</li>
        <li>Use the events array to emit structured hooks for off-chain indexers.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Review the <Link to="/docs/security" className="text-primary hover:underline">security guidelines</Link> when changing access control or decay logic.
      </p>
    </section>
  </div>
);

export default SmartContracts;
