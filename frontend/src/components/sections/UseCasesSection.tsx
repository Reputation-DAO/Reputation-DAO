import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import governanceIcon from "@/assets/governance.png";
import defiIcon from "@/assets/defi.png";
// using defiIcon temporarily to avoid import errors

import identityIcon from "@/assets/identity1.png";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircuitLines } from "@/components/ui/CircuitLines";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

const useCases = [
  {
    id: "governance",
    title: "DAOs & Governance",
    description:
      "Replace token-weighted voting with contribution-weighted trust. Keep decisions in the hands of proven builders.",
    image: governanceIcon,
    highlights: [
      "Dynamic voting weight tied to on-chain reputation",
      "Delegate dashboards with transparent contributions",
      "Immediate visibility into governance risk",
    ],
    ctaLabel: "Launch a reputation DAO",
  },
  {
    id: "defi",
    title: "DeFi & Protocols",
    description:
      "Bootstrap trust for credit markets, LP incentives, and protocol risk scoring without centralized gatekeepers.",
    image: defiIcon,
    highlights: [
      "Under-collateralized lending based on verified signals",
      "Programmatic risk tiers for capital efficiency",
      "Sybil-resistant rewards and loyalty programs",
    ],
    ctaLabel: "Design a trust layer",
  },
  {
    id: "identity",
    title: "Social & Identity",
    description:
      "Empower communities, creators, and marketplaces with portable credentials that unlock curated experiences.",
    image: identityIcon,
    highlights: [
      "Soulbound badges that travel across platforms",
      "Invite-only spaces guided by verified reputation",
      "Proof-of-contribution discovery feeds",
    ],
    ctaLabel: "Curate your community",
  },
];

const integrations = [
  "Wallets",
  "Smart contracts",
  "APIs",
  "Automation",
  "Dashboards",
  "Analytics",
];

const UseCasesSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a] overflow-hidden">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0d1220] via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Circuit lines background */}
      <div className="absolute inset-0 opacity-10">
        <CircuitLines />
      </div>
      
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
            Where it fits
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Drop reputation into{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              any product surface
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
            The UI is neutral enough to blend with your brand in light and dark
            themes, while the primitives stay powerful under the hood.
          </p>
        </motion.div>

        <Tabs defaultValue="governance" className="space-y-10">
          <motion.div
            className="flex justify-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.1}
            variants={fadeUp}
          >
            {/* THICKER NAV - no scroll, wraps cleanly */}
            <TabsList
              className="
                w-full max-w-4xl
                rounded-full border-2 border-border bg-background/70
                p-2 sm:p-2
                shadow-lg shadow-primary/5
                flex flex-wrap justify-center gap-3 sm:gap-4
                min-h-[80px] sm:min-h-[80px]
              "
            >
              {useCases.map((useCase) => (
                <TabsTrigger
                  key={useCase.id}
                  value={useCase.id}
                  className="
                    rounded-full
                    px-7 sm:px-8
                    py-1
                    text-base sm:text-lg
                    font-semibold
                    leading-none
                    border border-transparent
                    transition
                    data-[state=active]:bg-primary
                    data-[state=active]:text-primary-foreground
                    data-[state=active]:shadow-md
                    hover:border-border
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  "
                >
                  {useCase.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          {useCases.map((useCase, index) => (
            <TabsContent key={useCase.id} value={useCase.id} className="mt-0">
              <motion.div
                className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}
                custom={0.15 + index * 0.05}
                variants={fadeUp}
              >
                <TiltCard className="group rounded-2xl" style={{ perspective: '1000px' }}>
                  <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                    <CardContent className="flex h-full flex-col space-y-6 p-6 sm:p-8">
                    <div className="space-y-3">
                      <Badge className="w-fit bg-blue-600 text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]">
                        {useCase.title}
                      </Badge>
                      <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                        {useCase.description}
                      </h3>
                    </div>
                    <div className="grid gap-3">
                      {useCase.highlights.map((highlight) => (
                        <div
                          key={highlight}
                          className="flex items-start gap-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 px-4 py-3 text-sm text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300"
                        >
                          <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <ArrowRight className="h-3 w-3" />
                          </span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="mt-auto w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)] rounded-2xl">
                      <RouterLink to="/auth">{useCase.ctaLabel}</RouterLink>
                    </Button>
                    </CardContent>
                  </Card>
                </TiltCard>

                <TiltCard className="group rounded-[24px]" style={{ perspective: '1000px' }}>
                  <Card className="flex h-full flex-col overflow-hidden rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                    <CardContent className="flex h-full flex-col gap-6 p-6 sm:p-8">
                    <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5">
                      <img
                        src={useCase.image}
                        alt={useCase.title}
                        className="h-56 w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/5 px-4 py-4 text-sm text-gray-300">
                      <p className="font-medium text-white">
                        Activation blueprint
                      </p>
                      <p className="mt-2 leading-relaxed">
                        Start with ready-made flows, dashboards, and monitoring
                        checks tailored for {useCase.title.toLowerCase()} teams.
                      </p>
                      </div>
                      <div className="grow" />
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        <motion.div
          className="group"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={0.25}
          variants={fadeUp}
          style={{ perspective: '1000px' }}
        >
          <TiltCard className="rounded-2xl">
            <div className="rounded-2xl overflow-hidden border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl px-6 py-8 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
              <div className="flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Integrates with the tools you already use
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Compose reputation with your existing wallets, data pipelines,
                    and ops automation without breaking visual consistency.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:max-w-md">
                  {integrations.map((integration) => (
                    <span
                      key={integration}
                      className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400"
                    >
                      {integration}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
