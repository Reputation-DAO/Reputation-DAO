import { Link } from "react-router-dom";
import { Book, Code, Zap, Database, Shield, Users, Terminal } from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    description: "Spin up Reputation DAO locally, understand prerequisites, and connect the frontend to your canisters.",
    icon: Book,
    href: "/docs/getting-started",
    items: [
      "Toolchain prerequisites",
      "Local deployment workflow",
      "Frontend environment setup",
      "Factory + child testing"
    ]
  },
  {
    title: "API Reference",
    description: "Explore the core canister interfaces and the helper scripts that automate common lifecycle tasks.",
    icon: Code,
    href: "/docs/api",
    items: [
      "Factory management APIs",
      "Child reputation APIs",
      "Blog backend endpoints",
      "Shell test harness"
    ]
  },
  {
    title: "CLI Reference",
    description: "Automate reputation workflows from the terminal using the repdao CLI and its dedicated identity store.",
    icon: Terminal,
    href: "/docs/cli",
    items: [
      "Installation & quick start",
      "Identity management",
      "Award & revoke commands",
      "Analytics queries"
    ]
  },
  {
    title: "Smart Contracts",
    description: "Dive into the Motoko architecture behind the factory, child canisters, and persistent storage patterns.",
    icon: Zap,
    href: "/docs/smart-contracts",
    items: [
      "Factory lifecycle",
      "Child reputation engine",
      "Decay + analytics subsystems",
      "Upgrade strategy"
    ]
  },
  {
    title: "SDKs & Libraries",
    description: "See how the frontend layers connect2ic, shadcn/ui, and internal hooks to deliver role-aware UX.",
    icon: Database,
    href: "/docs/sdks",
    items: [
      "connect2ic integration",
      "Custom hooks",
      "Shared UI primitives",
      "3rd-party tooling"
    ]
  },
  {
    title: "Security",
    description: "Review our disclosure policy, hardening checklist, and the guardrails we follow before shipping.",
    icon: Shield,
    href: "/docs/security",
    items: [
      "Disclosure process",
      "Supported releases",
      "Operational safeguards",
      "Planned controls"
    ]
  },
  {
    title: "Community",
    description: "Connect with the builders, roadmap, and learning resources that keep the Reputation DAO ecosystem growing.",
    icon: Users,
    href: "/docs/community",
    items: [
      "Governance touchpoints",
      "Design + product assets",
      "Learning playlist",
      "Contribution guide"
    ]
  }
];

const DocsIndex = () => (
  <div>
    <section className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Documentation
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Everything you need to build with Reputation DAO. Start with the overview or jump straight into contracts, APIs, and tooling.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/docs/getting-started"
            className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
          >
            Quick Start
          </Link>
          <Link
            to="/docs/api"
            className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all duration-300"
          >
            API Reference
          </Link>
        </div>
      </div>
    </section>

    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <Link
                key={section.title}
                to={section.href}
                className="glass-card p-8 hover-lift group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                  {section.title}
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {section.description}
                </p>

                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </div>
    </section>

    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Popular Resources</h2>
          <p className="text-xl text-muted-foreground">
            Most accessed documentation and guides from the core team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link to="/docs/getting-started" className="glass-card p-8 hover-lift">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Quick Start Tutorial</h3>
            <p className="text-muted-foreground mb-6">
              Deploy the factory, mint your first organization, and connect the frontend in under 15 minutes.
            </p>
            <span className="text-primary font-medium hover:underline">Start Tutorial →</span>
          </Link>

          <Link to="/docs/smart-contracts" className="glass-card p-8 hover-lift">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Architecture Deep Dive</h3>
            <p className="text-muted-foreground mb-6">
              Understand how the factory orchestrates child canisters, manages cycles, and enforces soulbound reputation.
            </p>
            <span className="text-primary font-medium hover:underline">Read the Deep Dive →</span>
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default DocsIndex;
