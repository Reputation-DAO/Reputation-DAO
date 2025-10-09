import { motion } from "framer-motion";
import { Clock, Globe, Link, Shield, TrendingUp, Zap } from "lucide-react";
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

const benefits = [
  {
    title: "Tamper-proof history",
    description:
      "Reputational data is immutably stored on-chain. No hidden switches, no single points of failure.",
    icon: Shield,
  },
  {
    title: "Decentralized ownership",
    description:
      "Communities govern the reputation rails they rely on. Scores remain with the people who earned them.",
    icon: Globe,
  },
  {
    title: "Portable by default",
    description:
      "SDKs and APIs let you surface the same trust signals across products, chains, and governance tools.",
    icon: Link,
  },
  {
    title: "Permanent memory",
    description:
      "Attestations never disappear. Future contributors can audit how today’s leaders built trust.",
    icon: Clock,
  },
  {
    title: "Merit-first economics",
    description:
      "Soulbound credentials keep bots and reputation marketplaces out of the system for good.",
    icon: TrendingUp,
  },
  {
    title: "Ecosystem-ready",
    description:
      "Drop-in contracts and API hooks accelerate governance, incentive, and identity flows without extra glue work.",
    icon: Zap,
  },
];

const BenefitsSection = () => {
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
            Why builders choose us
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A reputation layer that feels native in any theme
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Designed to look and feel at home in light or dark mode. Neutral
            surfaces, adaptive borders, and purposeful accents keep the focus on
            your product.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.div
                key={benefit.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}
                custom={0.05 + index * 0.05}
                variants={fadeUp}
              >
                <Card className="flex h-full flex-col overflow-hidden rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-[6px] bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="flex flex-col items-center justify-between gap-4 rounded-[8px] border-2 border-border bg-background/70 px-6 py-8 text-center shadow-lg shadow-primary/5 sm:flex-row sm:text-left"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={0.3}
          variants={fadeUp}
        >
          <div>
            <p className="text-lg font-semibold text-foreground">
              Ready to see it in your product?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump into the beta or explore the docs to start embedding
              Reputation DAO today.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <RouterLink to="/auth">Join the beta</RouterLink>
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
                View roadmap
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
