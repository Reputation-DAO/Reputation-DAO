import { motion } from "framer-motion";
import { Code, Database, Eye, Globe, Server, Shield } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

const pillars = [
  {
    title: "Powered by ICP",
    description:
      "Canister smart contracts provide web-speed execution, predictable storage, and censorship resistance for reputation data.",
    icon: Server,
  },
  {
    title: "Soulbound identity",
    description:
      "Attestations are cryptographically tied to contributors. Reputation cannot be sold, lent, or inflated with bots.",
    icon: Shield,
  },
  {
    title: "Open & auditable",
    description:
      "Every write is transparent and verifiable. Observability hooks stream changes into analytics or governance dashboards.",
    icon: Eye,
  },
  {
    title: "Interoperable",
    description:
      "SDKs and APIs work across ICP, EVM, and Web2 stacks so you can surface reputation wherever it matters.",
    icon: Globe,
  },
  {
    title: "Programmable",
    description:
      "Compose governance, incentives, and access guardrails with reusable reputation modules or custom contracts.",
    icon: Code,
  },
];

const tooling = [
  {
    title: "CLI & templates",
    description: "Spin up canisters, dashboards, and CI pipelines in minutes.",
    icon: Code,
  },
  {
    title: "Data APIs",
    description: "Query attestations and trust graphs via REST or GraphQL.",
    icon: Database,
  },
  {
    title: "Reference contracts",
    description: "Drop-in modules for governance, access control, and rewards.",
    icon: Shield,
  },
];

const TechnicalSection = () => {
  return (
    <section className="relative z-10 py-6 md:py-7">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 rounded-[16px] border border-border/80 bg-card/70 px-4 py-12 shadow-md backdrop-blur-sm sm:px-8 lg:px-12">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0}
          variants={fadeUp}
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2 uppercase tracking-wide">
            Architecture
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Built to stay resilient in any environment
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Reputation DAO keeps the visuals light and adaptable, while the
            infrastructure underneath stays unstoppable.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.45 }}
            custom={0.1}
            variants={fadeUp}
          >
            <Card className="flex flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
              <CardContent className="flex flex-1 flex-col space-y-5 p-6 sm:p-8">
                <Badge className="w-fit bg-primary/90 text-primary-foreground">
                  Trust by design
                </Badge>
                <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Secure primitives, flexible surface area
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Critical logic stays on-chain, while SDKs and API layers keep
                  integration lightweight. Light or dark theme, the components
                  remain neutral and accessible.
                </p>
                <div className="rounded-[6px] border border-dashed border-primary/25 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Ready for production
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Deterministic upgrades with verified build artifacts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Shardable storage to meet long-term growth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>ZK-friendly architecture for privacy-preserving proofs</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <RouterLink to="/auth">Provision a canister</RouterLink>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <a
                      href="https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read the spec
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
              <CardContent className="flex flex-1 flex-col space-y-5 p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Tooling
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tooling.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.title}
                        className="flex items-start gap-3 rounded-[4px] bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">
                            {tool.title}
                          </p>
                          <p className="mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.45 }}
                  custom={0.15 + index * 0.05}
                  variants={fadeUp}
                >
                  <Card className="flex flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
                      <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {pillar.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {pillar.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSection;
