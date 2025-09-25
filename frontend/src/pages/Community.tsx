// src/pages/Community.tsx
// @ts-nocheck
import { useCallback, useState } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import {
  MessageCircle,
  Users,
  Github,
  Twitter,
  Calendar as CalendarIcon,
  Trophy,
  Heart,
  Star,
  Clock,
  CalendarDays,
} from "lucide-react";

const Community = () => {
  // ----- Interactive Poll (ported logic) -----
  const [votes, setVotes] = useState({ icpOnly: 2, multiCrypto: 0 });
  const [userVote, setUserVote] = useState<"icpOnly" | "multiCrypto" | null>(null);
  const totalVotes = votes.icpOnly + votes.multiCrypto;
  const percentIcpOnly = totalVotes ? Math.round((votes.icpOnly / totalVotes) * 100) : 0;
  const percentMultiCrypto = totalVotes ? Math.round((votes.multiCrypto / totalVotes) * 100) : 0;

  const handleVote = useCallback(
    (option: "icpOnly" | "multiCrypto") => {
      if (userVote === option) return;
      setVotes((prev) => {
        const next = { ...prev };
        if (userVote) next[userVote] = Math.max(0, next[userVote] - 1);
        next[option] = (next[option] || 0) + 1;
        return next;
      });
      setUserVote(option);
    },
    [userVote]
  );

  // ----- Newsletter modal (ported logic) -----
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const handleSubscribe = () => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      alert("Please enter a valid email address.");
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setNewsletterOpen(false);
      setSubmitted(false);
      setEmail("");
    }, 1500);
  };

  // ----- Data (kept + adapted) -----
  const communityStats = [
    { label: "Community Members", value: "2,500+", icon: Users },
    { label: "GitHub Contributors", value: "150+", icon: Github },
    { label: "Monthly Events", value: "12", icon: CalendarIcon },
    { label: "Projects Built", value: "35+", icon: Trophy },
  ];

  const linkItems = [
    {
      label: "GitHub",
      href: "https://github.com/Reputation-DAO/Reputation-DAO",
      icon: <Github className="w-6 h-6" />,
    },
    {
      label: "Core Idea",
      href: "https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0",
      icon: <Star className="w-6 h-6" />,
    },
    {
      label: "Watch Demo",
      href: "https://www.youtube.com/watch?v=iaZ4pHaWd_U",
      icon: <Clock className="w-6 h-6" />,
    },
    {
      label: "Presentation",
      href: "https://drive.google.com/file/d/18A6LH4TseJolKCbDPOf7et7IXwCj2fs0/view?usp=sharing",
      icon: <CalendarIcon className="w-6 h-6" />,
    },
    {
      label: "Complete Flow chart",
      href: "https://www.figma.com/board/fWhXwD7MX9wxylm8SumTqr/REPUTAION-DAO-WORKFLOW?t=xV8nwU4sJ0ZQSwEq-0",
      icon: <SchemaIconStub />,
    },
    {
      label: "Figma Link",
      href: "https://www.figma.com/design/1Qwqc7fWOyigkncoVoSiPH/REPUTATION-DAO?t=xV8nwU4sJ0ZQSwEq-0",
      icon: <DesignIconStub />,
    },
  ];

  const contributorsSpotlight = [
    {
      name: "Danis Pratap Singh",
      role: "Radical User",
      img: "/user/user1.png",
      description:
        "Founder & Lead Developer — smart contracts (Motoko), backend logic, and project strategy.",
    },
    {
      name: "Ayush Kumar Gaur",
      role: "Ayush3941",
      img: "/user/user2.png",
      description:
        "Frontend & Integration — UI components, wallet connections, and canister integrations.",
    },
  ];

  const events = [
    {
      title: "DAO Governance Call",
      date: "Nov 7, 2025",
      description: "Monthly community governance discussion & proposal review.",
      link: "#",
    },
    {
      title: "Smart Contract Workshop",
      date: "Nov 14, 2025",
      description: "Hands-on session on DAO contract architecture.",
      link: "#",
    },
    {
      title: "Community Onboarding Session",
      date: "Nov 21, 2025",
      description:
        "Live walkthrough for new members to explore DAO tools, governance, and opportunities.",
      link: "#",
    },
    {
      title: "Tokenomics Deep Dive",
      date: "Nov 28, 2025",
      description:
        "Webinar unpacking DAO token distribution, staking models, and incentives.",
      link: "#",
    },
    {
      title: "Quarterly DAO Town Hall",
      date: "Dec 12, 2025",
      description:
        "Leadership team shares updates, roadmap progress, and answers community questions.",
      link: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        {/* HERO (MUI -> Tailwind) */}
        <section
          className="relative py-24 border-b border-border/60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
              url('/banner/community.png')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 drop-shadow">
              Join the Reputation DAO Community
            </h1>
            <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto">
              Contribute, collaborate, and shape the future of decentralized reputation.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://t.me/reputationdao"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-white font-semibold shadow hover:brightness-110 transition"
              >
                Join Telegram
              </a>
              <a
                href="https://x.com/Reputation_Dao"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/40 text-white hover:bg-white/10 transition"
              >
                Follow on X (Twitter)
              </a>
            </div>
          </div>
        </section>

        {/* Community Stats (kept) */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {communityStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="glass-card p-6 text-center hover-lift"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Interactive Poll (MUI -> Tailwind) */}
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-wider uppercase text-foreground mb-3">
              Community Poll
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Should we accept ICP only as payment, or allow other cryptocurrencies too?
            </p>

            <div className="glass-card p-6 md:p-10 border border-border max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* ICP only */}
                <div>
                  <button
                    onClick={() => handleVote("icpOnly")}
                    aria-pressed={userVote === "icpOnly"}
                    className={[
                      "w-full px-4 py-3 font-bold rounded-md border transition",
                      userVote === "icpOnly"
                        ? "bg-primary text-white border-primary shadow"
                        : "text-primary border-primary hover:bg-primary/10",
                    ].join(" ")}
                  >
                    Accept ICP only ({percentIcpOnly}%)
                  </button>
                  <div className="h-2 mt-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-primary transition-[width] duration-500"
                      style={{ width: `${percentIcpOnly}%` }}
                    />
                  </div>
                </div>

                {/* Other cryptos */}
                <div>
                  <button
                    onClick={() => handleVote("multiCrypto")}
                    aria-pressed={userVote === "multiCrypto"}
                    className={[
                      "w-full px-4 py-3 font-bold rounded-md border transition",
                      userVote === "multiCrypto"
                        ? "bg-accent text-white border-accent shadow"
                        : "text-accent border-accent hover:bg-accent/10",
                    ].join(" ")}
                  >
                    Allow other cryptos ({percentMultiCrypto}%)
                  </button>
                  <div className="h-2 mt-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-accent transition-[width] duration-500"
                      style={{ width: `${percentMultiCrypto}%` }}
                    />
                  </div>
                </div>
              </div>

              {userVote && (
                <p className="mt-6 text-primary font-semibold" role="alert">
                  Thanks for voting! 🎉 You voted for{" "}
                  {userVote === "icpOnly" ? "Accept ICP only" : "Allow other cryptos"}.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Connect With Us (kept) */}
        <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-2 text-foreground">Connect With Us</h2>
              <p className="text-xl text-muted-foreground">
                Choose your preferred platform to engage with our community
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Discord",
                  description:
                    "Join our main community hub for real-time discussions, support, and announcements.",
                  icon: MessageCircle,
                  members: "2,500+",
                  link: "https://discord.com", // replace with real
                  color: "from-indigo-500 to-indigo-600",
                },
                {
                  name: "GitHub",
                  description:
                    "Contribute to the codebase, report issues, and collaborate on development.",
                  icon: Github,
                  members: "150+",
                  link: "https://github.com/Reputation-DAO/Reputation-DAO",
                  color: "from-gray-700 to-gray-800",
                },
                {
                  name: "Twitter",
                  description:
                    "Follow us for updates, announcements, and community highlights.",
                  icon: Twitter,
                  members: "5,000+",
                  link: "https://x.com/Reputation_Dao",
                  color: "from-blue-500 to-blue-600",
                },
              ].map((ch, i) => {
                const Icon = ch.icon;
                return (
                  <a
                    key={ch.name}
                    href={ch.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-8 hover-lift group"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${ch.color} flex items-center justify-center mb-6 group-hover:animate-pulse-glow`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                      {ch.name}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{ch.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-medium">{ch.members} members</span>
                      <span className="text-primary text-sm font-medium group-hover:text-primary-glow transition-colors">
                        Join →
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Events & Webinars (MUI -> Tailwind horizontal scroller) */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-foreground mb-2">Events & Webinars</h2>
              <p className="text-muted-foreground">
                Join our upcoming events to connect, learn, and share with other members of the DAO.
              </p>
            </div>

            <div
              className="flex gap-3 overflow-x-auto scroll-smooth px-1 py-1"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {events.map((ev, idx) => (
                <div
                  key={idx}
                  className="glass-card border border-border flex-none w-80 h-64 p-4 rounded-xl hover:translate-y-[-4px] transition shadow-sm"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                      {ev.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{ev.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{ev.description}</p>
                  <a
                    href={ev.link}
                    className="inline-flex items-center justify-center mt-4 px-3 py-1.5 text-sm rounded-md border border-primary text-primary hover:bg-primary/10 transition w-max"
                  >
                    Learn More
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Spotlight on Contributors (MUI -> Tailwind) */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-2 text-foreground">
              Spotlight on Contributors
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              Meet some of the amazing individuals who help build, grow, and sustain Reputation DAO.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 justify-items-center">
              {contributorsSpotlight.map((p, i) => (
                <div
                  key={i}
                  className="w-72 h-72 glass-card border border-border rounded-xl p-5 text-center hover:translate-y-[-4px] transition"
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary object-cover"
                  />
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-primary text-sm mb-1">{p.role}</div>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>

            <div className="w-full h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

        {/* Community Resources (MUI -> Tailwind) */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-6 text-foreground">Community Resources</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-items-center mb-12">
              {linkItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="w-36 aspect-square glass-card border border-border rounded-xl flex flex-col items-center justify-center gap-2 text-foreground hover:translate-y-[-3px] transition hover:border-primary"
                >
                  <div className="transition">{item.icon}</div>
                  <div className="text-sm font-semibold text-center">{item.label}</div>
                </a>
              ))}
            </div>

            <div className="w-full h-px my-8 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

        {/* Contribution Section (MUI -> Tailwind) */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-6 text-foreground">
              Contributing to Reputation DAO
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-card border border-border rounded-xl p-6 hover:-translate-y-1 transition">
                <h3 className="text-xl font-bold mb-2 text-foreground">Community Contributions</h3>
                <p className="text-muted-foreground leading-7">
                  There are many ways to contribute — improve the codebase, participate in
                  governance, propose features, write docs, tutorials, help new members, and amplify
                  our mission. Every contribution helps the DAO move forward.
                </p>
              </div>

              <div className="glass-card border border-border rounded-xl p-6 hover:-translate-y-1 transition">
                <h3 className="text-xl font-bold mb-2 text-foreground">Open Source Ethos</h3>
                <p className="text-muted-foreground leading-7">
                  Built on decentralization, transparency, and open governance. Our work is open
                  source — inspect, improve, and adapt it for the broader Web3 ecosystem. Join a
                  movement shaping a fairer, more accountable digital future.
                </p>
              </div>
            </div>

            <div className="w-full h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </section>

        {/* Newsletter (MUI -> Tailwind with modal) */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-card p-8 border border-primary/30 rounded-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition">
              <h3 className="text-3xl font-extrabold mb-2 text-foreground">Stay Updated</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Join our newsletter for insights, governance updates, releases, and opportunities to
                make an impact in the Reputation DAO community.
              </p>
              <button
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:scale-[1.02] transition"
                onClick={() => setNewsletterOpen(true)}
              >
                Subscribe Now
              </button>
            </div>
          </div>

          {/* Modal */}
          {newsletterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setNewsletterOpen(false)} />
              <div className="relative w-full max-w-md bg-background border border-border rounded-xl shadow p-0 overflow-hidden">
                <div className="bg-primary px-5 py-3">
                  <h4 className="text-primary-foreground font-bold text-lg">Join Our Newsletter</h4>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-foreground">
                    Stay updated with the latest news, insights, and updates. Enter your email below:
                  </p>
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-3 py-2 rounded-md bg-input text-foreground border border-border outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
                  <button
                    onClick={() => setNewsletterOpen(false)}
                    disabled={submitted}
                    className="px-4 py-2 rounded-md text-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubscribe}
                    disabled={submitted}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition"
                  >
                    {submitted ? "Subscribed!" : "Subscribe"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CTA (kept) */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-10 text-center border border-primary/20">
              <h3 className="text-3xl font-bold mb-4 text-foreground">Become a Contributor</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a developer, researcher, designer, or community builder, there's a
                place for you in the Reputation DAO ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition"
                >
                  Start Contributing
                </a>
                <a
                  href="#"
                  className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

/** Simple stubs to mirror MUI icon choices you had */
const SchemaIconStub = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path
      d="M6 3h12v4H6V3zm3 6h6v4H9V9zm-6 6h12v4H3v-4zm14 0h4v4h-4v-4z"
      fill="currentColor"
    />
  </svg>
);

const DesignIconStub = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path
      d="M3 17l6-6 4 4 8-8 1 1-9 9-4-4-6 6z"
      fill="currentColor"
    />
  </svg>
);

export default Community;
