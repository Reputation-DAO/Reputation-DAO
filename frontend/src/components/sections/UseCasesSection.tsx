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

const fadeUp = {
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
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Where it fits
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Drop reputation into any product surface
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
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
                <Card className="flex h-full flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
                  <CardContent className="flex h-full flex-col space-y-6 p-6 sm:p-8">
                    <div className="space-y-3">
                      <Badge className="w-fit bg-primary text-primary-foreground">
                        {useCase.title}
                      </Badge>
                      <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                        {useCase.description}
                      </h3>
                    </div>
                    <div className="grid gap-3">
                      {useCase.highlights.map((highlight) => (
                        <div
                          key={highlight}
                          className="flex items-start gap-3 rounded-[4px] bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                        >
                          <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ArrowRight className="h-3 w-3" />
                          </span>
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild size="lg" className="mt-auto w-full sm:w-auto">
                      <RouterLink to="/auth">{useCase.ctaLabel}</RouterLink>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="flex h-full flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
                  <CardContent className="flex h-full flex-col gap-6 p-6 sm:p-8">
                    <div className="overflow-hidden rounded-[6px] border border-border bg-muted/40">
                      <img
                        src={useCase.image}
                        alt={useCase.title}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                    <div className="rounded-[6px] border border-dashed border-primary/25 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
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
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        <motion.div
          className="rounded-[8px] border-2 border-border bg-background/70 px-6 py-8 shadow-lg shadow-primary/5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={0.25}
          variants={fadeUp}
        >
          <div className="flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="text-lg font-semibold text-foreground">
                Integrates with the tools you already use
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Compose reputation with your existing wallets, data pipelines,
                and ops automation without breaking visual consistency.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:max-w-md">
              {integrations.map((integration) => (
                <span
                  key={integration}
                  className="rounded-full border border-border/70 bg-muted/40 px-4 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
