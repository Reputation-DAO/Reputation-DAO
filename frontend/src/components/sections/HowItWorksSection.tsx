import { motion } from "framer-motion";
import { Trophy, UserCheck, Unlock, Gauge, Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HexagonBackground } from "@/components/ui/HexagonBackground";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp: any = {
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
    <section className="relative z-10 py-24 md:py-32 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a]">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0d1220] via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Hexagon background pattern */}
      <HexagonBackground />
      
      {/* Smooth gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#0d1220] z-0 pointer-events-none" />

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
            Step-by-step
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Three simple layers to build{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              unstoppable reputation
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
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
                  className="group"
                  style={{ perspective: '1000px' }}
                >
                  <TiltCard className="h-full rounded-2xl">
                    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                      <CardContent className="flex flex-1 flex-col gap-6 p-8 md:flex-row md:items-start md:gap-10">
                      <div className="flex flex-col items-center gap-4 md:w-48">
                        <div className="relative">
                          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border-2 border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="text-center md:text-left">
                          <Badge className="mb-2 bg-blue-600 text-white px-4 py-1.5 font-bold shadow-[0_0_20px_rgba(0,102,255,0.3)]">
                            {step.number}
                          </Badge>
                          <p className="text-xl font-bold text-white">
                            {step.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-5">
                        <p className="text-lg leading-relaxed text-gray-300">
                          {step.description}
                        </p>
                        <ul className="space-y-3">
                          {step.details.map((detail) => (
                            <li
                              key={detail}
                              className="flex items-start gap-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 px-5 py-4 text-sm text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                            >
                              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      </CardContent>
                    </Card>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="flex flex-col gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.2}
            variants={fadeUp}
          >
            <TiltCard className="flex flex-col group rounded-2xl" glowIntensity={0.2}>
              <Card className="flex flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                <CardContent className="flex flex-col space-y-6 p-8">
                <Badge className="w-fit px-4 py-2 bg-blue-500/10 border-2 border-blue-500/30 text-blue-400 font-semibold">
                  Builder tools
                </Badge>
                <h3 className="text-3xl font-bold text-white">
                  Integrate reputation without rethinking your stack
                </h3>
                <p className="text-lg leading-relaxed text-gray-300">
                  Use our SDKs, REST API, or drop-in smart contracts to start
                  consuming reputation instantly. Opt into advanced orchestration
                  only when you need it.
                </p>
                <div className="rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 px-6 py-5 text-sm text-gray-300">
                  <p className="font-bold text-white text-base mb-4">
                    Popular automations
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>Merit-weighted voting and proposals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>Token rewards tied to verified milestones</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,102,255,0.6)]" />
                      <span>Invite flows gated by proven expertise</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link to="/auth">
                    <Button size="lg" className="px-8 py-6 text-base font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)]">
                      Start building
                    </Button>
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
                      className="border-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-8 py-6 text-base font-semibold rounded-2xl"
                    >
                      Browse docs
                    </Button>
                  </a>
                </div>
                </CardContent>
              </Card>
            </TiltCard>

            <TiltCard className="group rounded-2xl" glowIntensity={0}>
              <Card className="rounded-2xl border border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                <CardContent className="flex flex-col gap-6 p-8">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-400">
                  Built for production
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.title}
                        className="flex items-start gap-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 px-5 py-4 text-sm text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                      >
                        <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-bold text-white text-base mb-1">
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
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
