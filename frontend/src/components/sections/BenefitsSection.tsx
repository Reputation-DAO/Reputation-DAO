import { motion } from "framer-motion";
import { Clock, Globe, Link, Shield, TrendingUp, Zap, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GridBackground } from "@/components/ui/GridBackground";
import { TiltCard } from "@/components/ui/TiltCard";

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
    <section className="relative z-10 py-24 md:py-32 bg-[#0d1220] overflow-hidden">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0d1220] via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Grid background pattern */}
      <GridBackground />
      
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
            Why builders choose us
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            A reputation layer that{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              feels native
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
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
                className="group"
                style={{ perspective: '1000px' }}
              >
                <TiltCard className="h-full rounded-[24px]">
                  <Card className="flex h-full flex-col overflow-hidden rounded-[24px] border border-blue-500/20 bg-[#0d1220]/80 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                    <CardContent className="flex flex-1 flex-col space-y-5 p-8">
                    <div className="relative">
                      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border-2 border-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-7 w-7" />
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-base leading-relaxed text-gray-300">
                      {benefit.description}
                    </p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="flex flex-col items-center justify-between gap-6 rounded-[24px] border border-blue-500/30 bg-gradient-to-br from-[#0d1220]/90 to-[#0d1220]/70 backdrop-blur-xl px-8 py-10 text-center shadow-[0_0_60px_rgba(0,102,255,0.15)] sm:flex-row sm:text-left"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div>
            <p className="text-2xl font-bold text-white mb-2">
              Ready to see it in your product?
            </p>
            <p className="text-base text-gray-400">
              Jump into the beta or explore the docs to start embedding
              Reputation DAO today.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="px-8 py-6 text-base font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)]">
              <RouterLink to="/auth">Join the beta</RouterLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-8 py-6 text-base font-semibold rounded-2xl"
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
