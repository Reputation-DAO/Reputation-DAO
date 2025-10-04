// src/pages/Community.tsx
import { useState } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import {
  Users,
  GitBranch,
  Rocket,
  Target,
  CalendarDays,
  MessageCircle,
  Sparkles,
  Mail,
  Handshake,
  PenTool,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

const stats = [
  {
    label: "Early builders",
    value: "~40",
    blurb: "Engineers, designers, and DAO ops experimenting with soulbound reputation flows.",
    icon: Users,
  },
  {
    label: "Core contributors",
    value: "6",
    blurb: "Motoko, React, and token design specialists shaping the alpha release.",
    icon: GitBranch,
  },
  {
    label: "Community pilots",
    value: "3",
    blurb: "Partner orgs validating incentives and reporting stack in real scenarios.",
    icon: Target,
  },
  {
    label: "Launch window",
    value: "Q1 ‘25",
    blurb: "Co-create the features and playbooks before the public rollout hits browsers.",
    icon: Rocket,
  },
];

const milestones = [
  {
    title: "Alpha reputation dashboards",
    status: "Live in private testing",
    eta: "December",
    description:
      "Role-based UX, audit trails, and decay controls are being iterated with pilot guilds.",
  },
  {
    title: "Factory launch checklist",
    status: "In review with advisors",
    eta: "January",
    description:
      "Automation around child canister reuse, budget alerts, and cycle vault safeguards.",
  },
  {
    title: "Community governance draft",
    status: "Drafting with early members",
    eta: "January",
    description:
      "We’re packaging decision templates for contributor onboarding and budget proposals.",
  },
  {
    title: "Open metrics portal",
    status: "Scoping",
    eta: "February",
    description:
      "Shared dashboards so every collective can benchmark trust health across orgs.",
  },
];

const channels = [
  {
    name: "Telegram",
    href: "https://t.me/reputationdao",
    summary: "Quick syncs, build logs, and daily questions from early testers.",
    icon: MessageCircle,
    accent: "from-blue-500 to-blue-600",
  },
  {
    name: "GitHub",
    href: "https://github.com/Reputation-DAO/Reputation-DAO",
    summary: "Issues, specs, and Motoko / React discussions for core contributors.",
    icon: Github,
    accent: "from-slate-700 to-slate-900",
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/Reputation_Dao",
    summary: "Release notes, partner spotlights, and governance threads.",
    icon: Twitter,
    accent: "from-sky-500 to-sky-600",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/reputation-dao/",
    summary: "Hiring updates, ecosystem partnerships, and long-form reflections.",
    icon: Linkedin,
    accent: "from-indigo-500 to-indigo-600",
  },
];

const opportunities = [
  {
    title: "Community stewards",
    badge: "Open",
    description:
      "Host monthly touchpoints, collect feedback loops, and help new collectives integrate our canisters.",
    icon: Handshake,
  },
  {
    title: "Motoko trailblazers",
    badge: "Seeking",
    description:
      "Pair program on decay logic, analytics endpoints, and factory orchestration improvements.",
    icon: Sparkles,
  },
  {
    title: "Design co-creators",
    badge: "In motion",
    description:
      "Collaborate on trust visualisations, progressive onboarding, and transparency reports.",
    icon: PenTool,
  },
];

const highlights = [
  {
    quote:
      "We’ve turned reputation decay from a scary cliff into a transparent curve. The Motoko factory pattern gives us the control surface we never had in legacy CRM tools.",
    name: "Danis Pratap Singh",
    role: "Core Builder",
  },
  {
    quote:
      "Frontend experiments are already mapping wallet intent to human-readable actions. We’re iterating fast because the community keeps shipping open issues and testing nightly builds.",
    name: "Ayush Kumar Gaur",
    role: "Interface & Integration",
  },
];

const Community = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isValid) {
      alert("Please add a valid email address so we can reach you.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 2400);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <Sparkles className="w-4 h-4" /> Early access collective
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Let’s design verifiable trust together
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Reputation DAO is co-building with people who believe coordination improves when credit is soulbound. Join now to shape the workflows, documentation, and governance that launch with the public release.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
                href="https://t.me/reputationdao"
                target="_blank"
                rel="noreferrer"
              >
                Join the build chat
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-border/60 hover:border-primary/60 text-foreground hover:text-primary transition"
                href="https://github.com/Reputation-DAO/Reputation-DAO"
                target="_blank"
                rel="noreferrer"
              >
                Explore the repo
              </a>
            </div>
          </section>
        </header>

        <section className="py-16 border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <article
                    key={stat.label}
                    className="glass-card p-6 h-full flex flex-col gap-3 border border-border/50"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <dl>
                      <dt className="text-sm uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </dt>
                      <dd className="text-3xl font-semibold text-foreground mt-1">
                        {stat.value}
                      </dd>
                    </dl>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stat.blurb}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                Why join the community now?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                We’re still wiring things up. Every feedback cycle lands directly with the builders and shapes what ships first.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {opportunities.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="glass-card p-7 flex flex-col gap-4 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition">
                      I’m interested
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                Near-term milestones
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Here’s what the team is actively polishing with early adopters. Jump in if you’d like to co-own a piece of the roadmap.
              </p>
            </div>
            <div className="space-y-6">
              {milestones.map((item, index) => (
                <article
                  key={item.title}
                  className="glass-card border border-border/60 p-6 flex flex-col sm:flex-row sm:items-start gap-5"
                >
                  <div className="flex-shrink-0 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">ETA {item.eta}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                    {item.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-secondary/20 via-background to-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-semibold text-foreground">Voices from the core team</h2>
                <p className="mt-3 text-muted-foreground">
                  We keep the loop tight. Weekly stand-ups in Telegram and GitHub issue threads mean ideas get feedback fast.
                </p>

                <ul className="mt-8 space-y-6">
                  {highlights.map((item) => (
                    <li key={item.name} className="glass-card p-6 border border-border/40">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        “{item.quote}”
                      </p>
                      <div className="mt-4 text-sm font-semibold text-foreground">
                        {item.name} · <span className="text-muted-foreground">{item.role}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card border border-border/60 p-8">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-primary font-semibold">
                  <Mail className="w-4 h-4" /> Early access updates
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-foreground">
                  Subscribe for build notes and community calls
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monthly digest with release notes, open issues we’d love help on, and invites to design reviews.
                </p>

                <div className="mt-6 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-70"
                  >
                    {submitting ? "Adding you..." : "Keep me in the loop"}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                  {submitted && (
                    <p className="text-sm text-primary font-medium">Thanks! We’ll be in touch soon.</p>
                  )}
                </div>

                <div className="mt-6 text-xs text-muted-foreground">
                  We never spam. Expect one note a month while we’re in early access.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-foreground">Stay plugged in</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Follow the channel that works for you. We post weekly progress, open issues, and call for feedback in each space.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <a
                    key={channel.name}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-card border border-border/60 p-6 flex flex-col gap-4 hover:-translate-y-1 transition"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${channel.accent} flex items-center justify-center text-white`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-lg font-semibold text-foreground">{channel.name}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {channel.summary}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Visit channel
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
              Ready to co-create reputation primitives?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              We’re shipping daily, listening constantly, and celebrating every contribution from the community. Jump in, claim an issue, or propose a workflow—we’ll build it together.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/Reputation-DAO/Reputation-DAO/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition"
              >
                Browse open issues
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@reputationdao.xyz"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-foreground hover:border-primary hover:text-primary transition"
              >
                Email the team
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
