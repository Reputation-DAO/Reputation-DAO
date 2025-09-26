import { Link } from "react-router-dom";

const GettingStarted = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        Getting Started with Reputation DAO
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Follow this guide to install the required toolchain, deploy the Motoko canisters, and hook the React frontend into your local or hosted environment.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Prerequisites</h2>
      <p className="text-muted-foreground mb-4">
        Ensure your workstation mirrors the production toolchain to avoid drift when promoting changes:
      </p>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li><strong>DFX 0.27.0</strong> – matches the version pinned in <code>dfx.json</code>.</li>
        <li><strong>Node.js 18+</strong> (tested on Node 24.x) and npm 9+ for the frontend build.</li>
        <li><strong>Python 3</strong> for helper scripts such as <code>factoria_test.sh</code>.</li>
        <li><strong>Plug</strong> (recommended) or Stoic/Internet Identity for wallet testing.</li>
      </ul>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Clone & Install</h2>
      <pre className="glass-card p-4 overflow-x-auto text-sm text-left">
{`git clone https://github.com/your-org/Reputation-Dao.git
cd Reputation-Dao

# Install frontend dependencies
cd frontend
npm install
cd ..`}
      </pre>
      <p className="text-muted-foreground mt-4">
        Backend dependencies are managed by DFX, so there is no additional package step for Motoko canisters.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Start the Local Replica</h2>
      <pre className="glass-card p-4 overflow-x-auto text-sm text-left">
{`dfx start --background --clean`}
      </pre>
      <p className="text-muted-foreground mt-4">
        The flag pair wipes previous state and runs the replica in the background. Stop it later with <code>dfx stop</code>.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Deploy the Factory Suite</h2>
      <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
        <li>
          <strong>Deploy canisters</strong>
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`dfx deploy --network local`}
          </pre>
        </li>
        <li>
          <strong>Upload the child WASM to the factory vault</strong>
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`dfx build reputation_dao
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/reputation_dao_wasm.arg').write_text(f'(blob "{arg}")')
print('wrote /tmp/reputation_dao_wasm.arg', len(wasm), 'bytes')
PY

dfx canister call factoria setDefaultChildWasm --argument-file /tmp/reputation_dao_wasm.arg`}
          </pre>
        </li>
        <li>
          <strong>Create a child organization</strong>
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`OWNER=$(dfx identity get-principal)
dfx canister call factoria createChildForOwner '(principal "$OWNER", 1_000_000_000_000:nat, vec {}, "local dev child")'`}
          </pre>
          <p className="mt-2">
            Save the returned child principal; you will need it for the frontend environment file.
          </p>
        </li>
      </ol>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Configure the Frontend</h2>
      <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
        <li>
          Copy the template env file:
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`cp frontend/env.example frontend/.env`}
          </pre>
        </li>
        <li>
          Populate the IDs returned by DFX:
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`VITE_IC_HOST=http://127.0.0.1:4943
VITE_FACTORIA_CANISTER_ID=<dfx canister id factoria>
VITE_REPUTATION_DAO_CANISTER_ID=<child principal>
VITE_BLOG_BACKEND_CANISTER_ID=<dfx canister id blog_backend>
VITE_FRONTEND_CANISTER_ID=<dfx canister id frontend>`}
          </pre>
        </li>
        <li>
          Start the Vite dev server:
          <pre className="glass-card p-4 mt-2 overflow-x-auto text-sm text-left">
{`cd frontend
npm run dev`}
          </pre>
        </li>
      </ol>
      <p className="text-muted-foreground mt-4">
        Visit <code>http://localhost:5173</code>, connect Plug, and select your organization in the Org Selector.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Smoke Test with Scripts</h2>
      <p className="text-muted-foreground mb-4">
        Use the bundled shell scripts to validate the factory lifecycle. Run them from the repo root after deployment:
      </p>
      <pre className="glass-card p-4 overflow-x-auto text-sm text-left">
{`./factoria_test.sh           # happy-path provisioning + lifecycle checks
./test_factoria_child.sh      # targeted child management checks
./test_multi_org_fixed.sh     # multi-tenant regression harness`}
      </pre>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Next Steps</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Review the <Link to="/docs/smart-contracts" className="text-primary hover:underline">smart contracts deep dive</Link> to understand upgrade and state-management strategy.</li>
        <li>Wire your production or playground canister IDs into <code>.env.production</code> before shipping.</li>
        <li>Integrate continuous deployment by invoking <code>dfx deploy</code> with the appropriate network in your CI pipeline.</li>
      </ul>
    </section>
  </div>
);

export default GettingStarted;
