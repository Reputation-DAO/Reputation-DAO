import { Link } from "react-router-dom";
import { Terminal, KeyRound, Award, Settings, Activity, Database } from "lucide-react";

const CliReference = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        CLI Reference
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        The <code>repdao</code> CLI wraps the same canister APIs as the SDK, adds identity management, and keeps you productive without juggling <code>dfx</code> commands. Install it once globally, point at your canisters, and script every lifecycle action from the terminal.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Install &amp; quick start</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-foreground">Install globally</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`npm i -g repdao
repdao --help`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Minimal workflow</h3>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
{`# set network (defaults to ic)
export REPDAO_NETWORK=ic

# point at a PEM if you don't want the built-in identity store
echo "REPDAO_PEM=/path/to/admin.pem" >> ~/.bashrc

# list commands
repdao help awardRep`}
          </pre>
          <p className="text-muted-foreground">
            Pass <code>--network</code> (<code>ic</code>, <code>local</code>, or any alias) and <code>--host</code> overrides per command if needed. Mainnet defaults to <code>https://icp-api.io</code>; local replicas hit <code>http://127.0.0.1:4943</code> and automatically fetch the root key.
          </p>
        </div>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Identity management</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <p className="text-muted-foreground">
          The CLI maintains a lightweight store under <code>~/.repdao</code> (secp256k1 PEM files). You can sync with your <code>dfx</code> identities or import PEMs manually.
        </p>
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
{`repdao id:list          # show repdao + dfx identities
repdao id:new alice      # generate a new secp256k1 identity
repdao id:use alice      # switch current identity
repdao id:import bob ./bob.pem
repdao id:export alice ./alice.pem
repdao id:sync           # copy all dfx identities into repdao
repdao id:whoami         # print the active principal`}
        </pre>
        <p className="text-muted-foreground">
          You can always override the active identity with <code>--pem</code> or <code>REPDAO_PEM</code> for a single command.
        </p>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Award &amp; moderation flows</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
{`repdao awardRep <child_id> <principal> <amount> --reason "great work"
repdao multiAward <child_id> --pairs '[ ["<user>", 25, "docs"], ["<user2>", 15] ]' --atomic
repdao revokeRep <child_id> <principal> <amount> --reason "spam"
repdao resetUser <child_id> <principal> --reason "requested"`}
        </pre>
        <p className="text-muted-foreground">
          All amounts are <code>Nat</code> and parsed as <code>bigint</code>. Optional strings map to Candid <code>opt text</code> automatically.
        </p>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Policy &amp; admin</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
{`repdao addTrustedAwarder <child_id> <awarder_principal> "Display Name"
repdao removeTrustedAwarder <child_id> <awarder_principal>
repdao setDailyMintLimit <child_id> 250
repdao setPerAwarderDailyLimit <child_id> <awarder_principal> 50
repdao configureDecay <child_id> 500 2592000 10 2592000 true
repdao blacklist <child_id> <principal> true
repdao pause <child_id> false
repdao transferOwnership <child_id> <new_owner>
repdao processBatchDecay <child_id>`}
        </pre>
        <p className="text-muted-foreground">
          Booleans accept <code>true</code>/<code>false</code>. The decay helper takes rate, interval, threshold, grace period, and enabled flag in sequence.
        </p>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Analytics &amp; history</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
{`repdao getBalance <child_id> <principal>
repdao getBalanceWithDetails <child_id> <principal>
repdao leaderboard <child_id> 10 0
repdao orgPulse <child_id> 0
repdao getTransactionsPaged <child_id> 0 25
repdao findTransactionsByReason <child_id> "docs" 10
repdao awarderStats <child_id> <principal>
repdao health <child_id>`}
        </pre>
        <p className="text-muted-foreground">
          Results are printed as JSON with <code>bigint</code> values converted to strings. Pipe the output to <code>jq</code> or redirect to a file when scripting dashboards.
        </p>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Cycles &amp; DX helpers</h2>
      <div className="glass-card p-6 space-y-4 text-sm">
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
{`repdao topUp <child_id>
repdao withdrawCycles <child_id> <vault_principal> 25000000000
repdao emitEvent <child_id> maintenance "cleared cache"
repdao emitEvent <child_id> metrics --b64 ZGF0YQ==`}
        </pre>
        <p className="text-muted-foreground">
          Use <code>--b64</code> or <code>--hex</code> whenever your payload is non-textual. Events are stored by the canister and surfaced in admin dashboards.
        </p>
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Troubleshooting</h2>
      <div className="glass-card p-6 space-y-3 text-sm">
        <p className="text-muted-foreground">
          • <strong>Hosts &amp; networks:</strong> pass <code>--host</code> for bespoke gateways. Non-mainnet networks automatically request the root key, but you can skip this by pre-setting <code>DFX_NETWORK</code>.
        </p>
        <p className="text-muted-foreground">
          • <strong>Identity overrides:</strong> <code>--pem</code> always wins. If nothing is configured, the CLI falls back to your current <code>dfx</code> identity (when available).
        </p>
        <p className="text-muted-foreground">
          • <strong>Cache:</strong> actors are cached per combination of canister, host, and principal. Restart the CLI or pass <code>--host</code> with a dummy query parameter to force a fresh agent during debugging.
        </p>
      </div>
    </section>

    <footer className="mb-12 text-center text-sm text-muted-foreground">
      Looking for the JavaScript API instead? Head over to the <Link to="/docs/api" className="text-primary hover:underline">API reference</Link> to see the typed helpers in action.
    </footer>
  </div>
);

export default CliReference;
