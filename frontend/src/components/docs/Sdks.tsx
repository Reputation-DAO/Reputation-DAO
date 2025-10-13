import { Link } from "react-router-dom";

const items = [
  {
    title: "connect2ic + Plug",
    body: "Wallet onboarding and actor creation are handled through connect2ic. We register Plug, Stoic, and Internet Identity providers, then expose the child actor via makeChildWithPlug.",
    resource: "frontend/src/lib/canisters/child.ts"
  },
  {
    title: "Auth & Role Contexts",
    body: "The AuthContext wraps Plug login status, while RoleContext pulls factory metadata to expose admin, awarder, and member states to the router.",
    resource: "frontend/src/contexts"
  },
  {
    title: "UI Primitives",
    body: "shadcn/ui, Radix primitives, TailwindCSS, and custom glassmorphism cards combine to produce consistent UX with dark/light support.",
    resource: "frontend/src/components/ui"
  },
  {
    title: "Data Fetching",
    body: "TanStack Query caches canister calls and invalidates on write actions, keeping dashboards responsive without manual state juggling.",
    resource: "frontend/src/features/dashboard/DashboardPage.tsx"
  }
];

const Sdks = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        SDKs & Libraries
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        The frontend layers several libraries—connect2ic, shadcn/ui, Radix, TanStack Query, and custom hooks—to present canister data and role-specific flows. This page explains the integration points you can reuse.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Wallet & Actor Setup</h2>
      <p className="text-muted-foreground mb-4">
        Authentication uses Internet Identity, which is managed in <code>AuthContext</code>. The helper <code>makeChildActor</code> instantiates candid actors with the authenticated identity.
      </p>
      <pre className="glass-card p-4 text-sm overflow-x-auto">
{`import { makeChildActor } from "@/lib/canisters";

const actor = await makeChildActor({
  canisterId: import.meta.env.VITE_REPUTATION_DAO_CANISTER_ID!,
});`}
      </pre>
      <p className="text-muted-foreground mt-4">
        When adding new canisters, extend <code>frontend/src/lib/canisters</code> with typed helpers so hooks and pages remain strongly typed.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">State & Data Fetching</h2>
      <p className="text-muted-foreground mb-4">
        TanStack Query is initialised in <code>App.tsx</code>. Use <code>useQuery</code> for read operations and <code>useMutation</code> for writes so the library handles caching and error states.
      </p>
      <pre className="glass-card p-4 text-sm overflow-x-auto">
{`const { data: leaderboard } = useQuery({
  queryKey: ["leaderboard", cid],
  queryFn: () => child.leaderboard(),
  enabled: !!child,
});`}
      </pre>
      <p className="text-muted-foreground mt-4">
        Wrap write flows (award, revoke, decay) in mutations that invalidate relevant query keys once the call succeeds.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">UI System</h2>
      <p className="text-muted-foreground mb-4">
        Layout components such as <code>Navigation</code>, <code>Footer</code>, and <code>DashboardLayout</code> pair with reusable shadcn/ui primitives (cards, tabs, forms). Tailwind themes are configured in <code>tailwind.config.ts</code>.
      </p>
      <p className="text-muted-foreground">
        To add a new UI atom, scaffold it under <code>frontend/src/components/ui</code> and export via <code>components.json</code> so shadcn generates consistent tokens.
      </p>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Local Utilities & Hooks</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li><code>useWalletConnectionMonitor</code> keeps Plug sessions fresh.</li>
        <li><code>useMobile</code> adapts responsive layouts when screen width is constrained.</li>
        <li><code>useToast</code> centralises notifications so transactions surface feedback consistently.</li>
        <li><code>transactionUtils.ts</code> maps raw candid transactions into UI-friendly objects.</li>
      </ul>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Adding Your Own Integrations</h2>
      <p className="text-muted-foreground mb-4">
        When introducing third-party wallets or analytics SDKs:
      </p>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Register the provider in connect2ic and expose any additional identity metadata through <code>AuthContext</code>.</li>
        <li>Keep new hooks self-contained so screens remain declarative.</li>
        <li>Document the SDK in this section with setup instructions for contributors.</li>
      </ul>
      <p className="text-muted-foreground mt-4">
        Pair this guide with the <Link to="/docs/getting-started" className="text-primary hover:underline">Getting Started</Link> instructions to expose new tooling in dev environments.
      </p>
    </section>
  </div>
);

export default Sdks;
