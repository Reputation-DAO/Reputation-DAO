import { motion } from "framer-motion";
import { Trophy, UserCheck, Unlock, Gauge, Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

const steps = [
  {
    number: "01",
    title: "Earn reputation",
    description:
      "Submit proposals, review code, lead initiatives, or host events. Every validated action mints a soulbound attestation.",
    icon: Trophy,
    details: [
      "Use integrations for GitHub, governance, or custom attestations",
      "Reviewers add contextual metadata so contributions stay meaningful",
    ],
  },
  {
    number: "02",
    title: "Anchor identity",
    description:
      "Reputation is tied to your identity, not your wallet. Attestations travel with you across DAOs, protocols, and products.",
    icon: UserCheck,
    details: [
      "Selective disclosure lets you prove what matters in each context",
      "Zero-knowledge ready for privacy-preserving experiences",
    ],
  },
  {
    number: "03",
    title: "Unlock opportunities",
    description:
      "Automate governance, incentives, and access using reputation-aware smart contracts or simple API calls.",
    icon: Unlock,
    details: [
      "Gated communities with verifiable membership criteria",
      "Dynamic rewards that respond to long-term participation",
    ],
  },
];

const stats = [
  {
    icon: Gauge,
    title: "Under 60s",
    description: "Average time to mint a new attestation on-chain.",
  },
  {
    icon: Compass,
    title: "Any stack",
    description: "SDKs for ICP, EVM, browsers, and server-side workloads.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 rounded-[32px] border border-border/70 bg-background px-4 py-12 shadow-xl sm:px-8 lg:px-12">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0}
          variants={fadeUp}
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2 uppercase tracking-wide">
            Step-by-step
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Three simple layers to build unstoppable reputation
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground/90">
            Bring contributors into the flow, anchor their work on-chain, and
            automate access to the experiences they unlock.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="flex flex-col gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.45 }}
                  custom={0.1 + index * 0.08}
                  variants={fadeUp}
                >
                  <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-border bg-background shadow-xl">
                    <CardContent className="flex flex-1 flex-col gap-5 p-6 md:flex-row md:items-start md:gap-8">
                      <div className="flex flex-col items-center gap-3 md:w-44">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="text-center md:text-left">
                          <Badge className="mb-1 bg-primary/90 text-primary-foreground">
                            {step.number}
                          </Badge>
                          <p className="text-lg font-semibold text-foreground">
                            {step.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <p className="text-base leading-relaxed text-muted-foreground/90">
                          {step.description}
                        </p>
                        <ul className="space-y-3">
                          {step.details.map((detail) => (
                            <li
                              key={detail}
                              className="flex items-start gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                            >
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="flex flex-col gap-6 lg:h-full lg:justify-between"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.2}
            variants={fadeUp}
          >
            <Card className="flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-background shadow-xl lg:flex-1">
              <CardContent className="flex flex-1 flex-col space-y-5 p-6">
                <Badge variant="secondary" className="px-3 py-1">
                  Builder tools
                </Badge>
                <h3 className="text-2xl font-semibold text-foreground">
                  Integrate reputation without rethinking your stack
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground/90">
                  Use our SDKs, REST API, or drop-in smart contracts to start
                  consuming reputation instantly. Opt into advanced orchestration
                  only when you need it.
                </p>
                <div className="rounded-xl border border-dashed border-primary/30 bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Popular automations
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Merit-weighted voting and proposals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Token rewards tied to verified milestones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Invite flows gated by proven expertise</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/auth">
                    <Button size="lg">Start building</Button>
                  </Link>
                  <a
                    href="https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Browse docs
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border bg-background shadow-xl">
              <CardContent className="flex flex-col gap-4 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Built for production
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.title}
                        className="flex items-start gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">
                            {stat.title}
                          </p>
                          <p className="leading-relaxed">{stat.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
