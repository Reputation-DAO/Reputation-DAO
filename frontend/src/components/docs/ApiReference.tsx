const ApiReference = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        API Reference
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Reputation DAO ships a typed JavaScript SDK (<code>repdao</code>) alongside the raw Motoko canister interfaces. Use these notes to wire the client into your app or call the canisters directly when you need full control over lifecycle automation.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">JavaScript SDK (`repdao`)</h2>
      <p className="text-muted-foreground mb-4">
        The <code>repdao</code> package bundles both the programmatic client and the CLI. Typed wrappers map one-to-one to canister methods, while <code>invokeQuery</code>/<code>invokeUpdate</code> let you hit any endpoint before a helper exists.
      </p>
      <div className="glass-card p-6 space-y-6 text-sm">
        <div>
          <h3 className="font-semibold text-foreground">Install</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`# inside a project
npm i repdao

# optional: install the CLI globally
npm i -g repdao
repdao --help`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Call typed helpers</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`import {
  awardRep,
  getBalance,
  health,
  invokeQuery,
  identityFromPemFile,
} from 'repdao';

const cid = 'txygj-baaaa-aaaam-qd1bq-cai';
const user = 'ly6rq-d4d23-63ct7-e2j6c-257jk-627xo-wwwd4-lnxm6-qt4xb-573bv-bqe';

async function demo() {
  const identity = identityFromPemFile('~/.repdao/alice.pem');

  await awardRep(cid, user, 100n, 'great work', {
    identity,
    network: 'ic',
  });

  const bal = await getBalance(cid, user, { identity });
  console.log('Balance', bal.toString());

  const stats = await health(cid, { network: 'local' });
  console.log('Health', stats);

  const decay = await invokeQuery(cid, 'getDecayStatistics', [], { identity });
  console.log('Decay stats', decay);
}

demo().catch(console.error);`}
          </pre>
          <p className="mt-3 text-muted-foreground">
            <strong>ClientOptions:</strong> pass <code>identity</code>, <code>network</code> (<code>ic</code>, <code>local</code>, or any string), and <code>host</code>. When omitted, the client resolves <code>https://icp-api.io</code> for mainnet and <code>http://127.0.0.1:4943</code> for a local replica (fetching the root key automatically).
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Identity helpers</h3>
          <p className="mt-2 text-muted-foreground">
            The CLI maintains PEMs under <code>~/.repdao</code>, but you can load any secp256k1 file via <code>identityFromPemFile</code>. The helper returns a <code>SignIdentity</code> ready to be injected into the SDK or passed to <code>HttpAgent</code> manually.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Advanced usage</h3>
          <p className="mt-2 text-muted-foreground">
            Actor instances are cached per canister, host, and principal. Switching identities or networks transparently warms a new agent. Stick with the typed wrappers for most work and fall back to <code>invokeQuery</code>/<code>invokeUpdate</code> when experimenting with new Motoko methods.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Client internals (for TypeScript projects)</h3>
          <p className="mt-2 text-muted-foreground">
            The SDK exposes the same building blocks we use internally in <code>src/client.ts</code>. When you import directly from <code>repdao</code>, you also get:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <code>ClientOptions</code> (<code>identity</code>, <code>network</code>, <code>host</code>) so every helper can run on mainnet, a local replica, or a custom gateway without additional plumbing.
            </li>
            <li>
              Utility types such as <code>BigNumberish</code> and the thin wrappers <code>P</code>, <code>N</code>, <code>B</code>, and <code>Opt</code> that translate strings/booleans/optionals into Motoko-friendly values.
            </li>
            <li>
              Narrow TypeScript views for common queries (<code>Awarder</code>, <code>Health</code>, <code>DecayConfig</code>, etc.) so you get intellisense instead of wrestling with raw candid tuples.
            </li>
            <li>
              A shared <code>actorCache</code> keyed by <code>canisterId::host::principal</code>, ensuring repeated calls reuse the same <code>HttpAgent</code> until you swap identity or network.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Need to integrate in an existing stack? Import the helpers directly:
          </p>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`import {
  ClientOptions,
  awardRep,
  configureDecay,
  getDecayStatistics,
  invokeUpdate,
  Health,
} from 'repdao';

const opts: ClientOptions = { network: 'custom', host: 'https://icp0.io', identity };

await awardRep(childId, userPrincipal, 50n, 'docs sprint', opts);
await configureDecay(childId, 500, 2_592_000, 10, 2_592_000, true, opts);

const stats = (await getDecayStatistics(childId, opts)) as Health;
console.log(stats.cycles.toString());

// call a brand-new method before a wrapper ships
await invokeUpdate(childId, 'emitEvent', ['maintenance', new Uint8Array()], opts);`}
          </pre>
          <p className="mt-3 text-muted-foreground">
            This mirrors the <code>src/client.ts</code> implementation: the SDK resolves the host, fetches the replica root key when required, constructs the actor with the generated <code>idlFactory</code>, and catches candid errors so you receive readable stack traces.
          </p>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Factory Canister (`factoria`)</h2>
      <p className="text-muted-foreground mb-4">
        The factory orchestrates child deployments, tracks ownership, and manages the shared cycles vault. Use these calls from operators or automation (or hit the same endpoints through <code>invokeUpdate</code>/<code>invokeQuery</code> in the SDK).
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
        Each organization receives a dedicated actor instance. The interface balances minting controls, auditability, and analytics. The SDK mirrors every method (<code>awardRep</code>, <code>multiAward</code>, <code>revokeRep</code>, <code>getBalanceWithDetails</code>, and more).
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
        A lightweight CMS powers the marketing blog. Store and retrieve posts through the generated declarations under <code>frontend/src/declarations/blog_backend</code>. When using the SDK, call <code>invokeQuery</code>/<code>invokeUpdate</code> with the blog canister ID.
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
            Call <code>setPost</code> with an author struct, body string, and status variant (#Draft, #Published, #Archived). The React app normalises these values in <code>Blog.tsx</code>.
          </p>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Generated TypeScript Declarations</h2>
      <p className="text-muted-foreground mb-4">
        Run <code>dfx generate</code> to refresh the bindings under <code>src/declarations</code>. Copy the folders you need into <code>frontend/src/declarations</code> so the UI and SDK stay in sync with the canister API surface.
      </p>
      <p className="text-muted-foreground">
        Frontend actors are instantiated via <code>makeChildWithPlug</code> and connect2ic. See the SDKs guide for a deep dive into how those adapters compose with the <code>repdao</code> helpers.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Automated Scripts</h2>
      <p className="text-muted-foreground mb-4">
        Shell helpers wrap many of these calls. <code>factoria_test.sh</code>, for example, seeds the default WASM, mints a child, exercises lifecycle operations, and validates registry indexes. Review scripts before running on production networks and adjust cycle amounts to match your budget.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Referenced repositories</h2>
      <p className="text-muted-foreground">
        The SDK and CLI live at <code>github.com/Reputation-DAO/RepDao-Cli</code> and are published to npm as <code>repdao</code>. Every release bundles the TypeScript helpers documented above together with the CLI entrypoint.
      </p>
    </section>
  </div>
);

export default ApiReference;
