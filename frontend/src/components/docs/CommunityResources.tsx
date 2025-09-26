import { Link } from "react-router-dom";

const resources = [
  {
    title: "Monthly Governance Call",
    description: "Review roadmap progress, proposals, and open questions with the core team and early adopters.",
    cadence: "First Thursday of each month",
  },
  {
    title: "Smart Contract Workshops",
    description: "Hands-on sessions exploring factory lifecycle management, Motoko patterns, and upgrade hygiene.",
    cadence: "Bi-weekly (refer to Telegram announcements)",
  },
  {
    title: "Design & Product Jam",
    description: "Figma walkthroughs and UX critiques to keep the dashboard polished and accessible.",
    cadence: "Monthly, alternating with workshops",
  },
  {
    title: "Community Onboarding",
    description: "Live orientation for new guild leads—covers setup, role assignment, and best practices for awarding reputation.",
    cadence: "Every third Thursday",
  }
];

const CommunityResources = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="mb-12 text-center">
      <span className="uppercase tracking-wide text-sm text-primary">Docs</span>
      <h1 className="text-3xl sm:text-5xl font-bold mt-4 mb-6 text-foreground">
        Community & Contribution
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Reputation DAO grows through open collaboration. Use this page to find our communication channels, contribution workflow, and showcase materials for grants and partners.
      </p>
    </header>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Join the Conversation</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Telegram: <a href="https://t.me/reputationdao" target="_blank" rel="noreferrer" className="text-primary hover:underline">@reputationdao</a></li>
        <li>X (Twitter): <a href="https://x.com/Reputation_Dao" target="_blank" rel="noreferrer" className="text-primary hover:underline">@Reputation_Dao</a></li>
        <li>GitHub: <a href="https://github.com/Reputation-DAO/Reputation-DAO" target="_blank" rel="noreferrer" className="text-primary hover:underline">Reputation-DAO</a></li>
        <li>YouTube demo: <a href="https://www.youtube.com/watch?v=iaZ4pHaWd_U" target="_blank" rel="noreferrer" className="text-primary hover:underline">Protocol showcase</a></li>
      </ul>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Events & Programs</h2>
      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource.title} className="glass-card p-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">{resource.title}</h3>
            <p className="text-muted-foreground mb-2">{resource.description}</p>
            <p className="text-sm text-muted-foreground">Cadence: {resource.cadence}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Contribution Workflow</h2>
      <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
        <li>Open an issue describing the bug, feature, or research proposal. Tag it with <code>backend</code>, <code>frontend</code>, <code>docs</code>, or <code>community</code>.</li>
        <li>Fork the repository and branch with <code>feature/&lt;topic&gt;</code> or <code>fix/&lt;bug&gt;</code>.</li>
        <li>Implement the change with clear commits, extending Motoko tests or frontend coverage where relevant.</li>
        <li>Submit a pull request summarising the impact, required follow-up, and any ops considerations (cycle budgets, env updates).</li>
      </ol>
      <p className="text-muted-foreground mt-4">
        We value concise comments that explain non-obvious logic and rely on the docs pages you are reading to onboard new contributors quickly.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Grant & Partner Materials</h2>
      <ul className="space-y-3 text-muted-foreground list-disc list-inside">
        <li>Architecture summary: see <Link to="/docs/smart-contracts" className="text-primary hover:underline">Smart Contract Architecture</Link>.</li>
        <li>Deployment checklist: embedded in <Link to="/docs/getting-started" className="text-primary hover:underline">Getting Started</Link>.</li>
        <li>Security stance: review <Link to="/docs/security" className="text-primary hover:underline">Security & Disclosure</Link> with prospective operators.</li>
        <li>Design artifacts: linked from the community landing page inside the app for quick demos.</li>
      </ul>
    </section>
  </div>
);

export default CommunityResources;
