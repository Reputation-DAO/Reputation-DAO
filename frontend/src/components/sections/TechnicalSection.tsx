import { motion } from "framer-motion";
import { Code, Database, Eye, Globe, Server, Shield, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.21, 0.82, 0.27, 1] as const },
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
    <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a] overflow-hidden">
      {/* Smooth gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent via-slate-100/50 to-slate-50 dark:from-transparent dark:via-[#0a0e1a]/50 dark:to-[#0a0e1a] z-0 pointer-events-none" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-6 px-6 py-2.5 uppercase tracking-wide text-sm font-semibold border-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Sparkles className="mr-2 h-4 w-4" />
            Architecture
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Built to stay{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              resilient
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
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
            <TiltCard className="group rounded-[24px]" style={{ perspective: '1000px' }}>
              <Card className="flex flex-col overflow-hidden rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                <CardContent className="flex flex-1 flex-col space-y-5 p-6 sm:p-8">
                <Badge className="w-fit bg-blue-600 text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]">
                  Trust by design
                </Badge>
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                  Secure primitives, flexible surface area
                </h3>
                <p className="text-sm leading-relaxed text-gray-400 sm:text-base">
                  Critical logic stays on-chain, while SDKs and API layers keep
                  integration lightweight. Light or dark theme, the components
                  remain neutral and accessible.
                </p>
                <div className="rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5 px-4 py-4 text-sm text-gray-300">
                  <p className="font-medium text-white">
                    Ready for production
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>Deterministic upgrades with verified build artifacts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>Shardable storage to meet long-term growth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>ZK-friendly architecture for privacy-preserving proofs</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)] rounded-2xl">
                    <RouterLink to="/auth">Provision a canister</RouterLink>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-2xl"
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
            </TiltCard>

            <TiltCard className="group" style={{ perspective: '1000px' }}>
              <Card className="flex flex-col overflow-hidden rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                <CardContent className="flex flex-1 flex-col space-y-5 p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                  Tooling
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tooling.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.title}
                        className="flex items-start gap-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 px-4 py-3 text-sm text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                      >
                        <span className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium text-white">
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
            </TiltCard>
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
                  className="group"
                  style={{ perspective: '1000px' }}
                >
                  <TiltCard className="h-full rounded-[24px]">
                    <Card className="flex flex-col overflow-hidden rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
                        <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-white">
                            {pillar.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-gray-400">
                            {pillar.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TiltCard>
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
