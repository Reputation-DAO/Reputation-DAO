const ApiReference = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        API Reference
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Reputation DAO exposes three canisters—the factory, child reputation engine, and blog backend—alongside helper scripts. This reference highlights the methods you will call most frequently.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Factory Canister (`factoria`)</h2>
      <p className="text-muted-foreground mb-4">
        The factory orchestrates child deployments, tracks ownership, and manages the shared cycles vault. Use these calls from operators or backend automation:
      </p>
      <div className="glass-card p-6 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground">Create a child</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria createChildForOwner '(principal "<owner>", 1_000_000_000_000:nat, vec {}, "notes")'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">List registered children</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria listChildren`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Inspect metadata</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria getChild '(principal "<child_id>")'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Manage lifecycle</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria stopChild '(principal "<child_id>")'
dfx canister call factoria startChild '(principal "<child_id>")'
dfx canister call factoria archiveChild '(principal "<child_id>")'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Top up or drain cycles</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria topUpChild '(principal "<child_id>", 1_000_000_000:nat)'
dfx canister call <child_id> returnCyclesToFactory '(100_000_000:nat)'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Upload the canonical child WASM</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call factoria setDefaultChildWasm --argument-file src/factoria/reputation_dao_wasm.arg`}
          </pre>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Child Reputation Canister (`reputation_dao`)</h2>
      <p className="text-muted-foreground mb-4">
        Each organization receives a dedicated actor instance. The interface balances minting controls, auditability, and analytics.
      </p>
      <div className="glass-card p-6 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground">Award reputation</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> awardRep '(principal "<recipient>", 10:nat, opt "reason")'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Batch award (atomic flag)</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> multiAward '(vec { (principal "<user1>", 5:nat, null); (principal "<user2>", 3:nat, null) }, true)'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Revoke reputation</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> revokeRep '(principal "<user>", 5:nat, opt "Spam")'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Manage awarders</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> addTrustedAwarder '(principal "<awarder>", "Display name")'
dfx canister call <child_id> removeTrustedAwarder '(principal "<awarder>")'
dfx canister call <child_id> setPerAwarderDailyLimit '(principal "<awarder>", 100:nat)'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Configure decay</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> configureDecay '(record {
  decayRate = 500;              // 5%
  decayInterval = 2_592_000;    // seconds (30 days)
  minThreshold = 10;
  gracePeriod = 2_592_000;
  enabled = true
})'`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Query analytics</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call <child_id> leaderboard
dfx canister call <child_id> getTransactionHistory
dfx canister call <child_id> getDecayStatistics
dfx canister call <child_id> orgPulse`}
          </pre>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Blog Backend (`blog_backend`)</h2>
      <p className="text-muted-foreground mb-4">
        A lightweight CMS powers the marketing blog. Store and retrieve posts through the generated declarations under <code>frontend/src/declarations/blog_backend</code>.
      </p>
      <div className="glass-card p-6 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground">List posts</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`dfx canister call blog_backend getPosts`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Create or update content</h3>
          <p className="mt-2 text-muted-foreground">
            Use <code>setPost</code> with an author struct, body string, and status variant (#Draft, #Published, #Archived). The frontend normalises these values through <code>Blog.tsx</code>.
          </p>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Generated TypeScript Declarations</h2>
      <p className="text-muted-foreground mb-4">
        Running <code>dfx generate</code> outputs updated Candid bindings in <code>src/declarations</code>. Copy the relevant folder into <code>frontend/src/declarations</code> to keep the UI in sync.
      </p>
      <p className="text-muted-foreground">
        In the frontend, actors are instantiated via <code>makeChildWithPlug</code> and the connect2ic adapters—see the SDKs guide for details.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Automated Scripts</h2>
      <p className="text-muted-foreground mb-4">
        The shell helpers wrap many of these calls in a reproducible sequence. For example, <code>factoria_test.sh</code> seeds the WASM, mints a child, exercises lifecycle operations, and validates registry indexes.
      </p>
      <p className="text-muted-foreground">
        Review the script before running on production networks and adjust cycle amounts to match your budget.
      </p>
    </section>
  </div>
);

export default ApiReference;
