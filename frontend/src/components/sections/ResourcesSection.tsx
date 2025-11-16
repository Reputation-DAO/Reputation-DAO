import { motion } from "framer-motion";
import { FileText, Headphones, Play, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

const resources = [
  {
    title: "Core idea",
    description:
      "Deep dive into the trust primitives, governance design, and roadmap powering Reputation DAO.",
    icon: FileText,
    chip: "Whitepaper",
    link: "https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0",
  },
  {
    title: "Product demo",
    description:
      "Watch the end-to-end flow: soulbound minting, governance unlocks, and developer tooling in action.",
    icon: Play,
    chip: "Video",
    link: "https://www.youtube.com/watch?v=iaZ4pHaWd_U",
  },
  {
    title: "Founders AMA",
    description:
      "Hear from the team on scaling trust-native ecosystems, technical guardrails, and upcoming releases.",
    icon: Headphones,
    chip: "Audio",
    link: "https://www.youtube.com/watch?v=iaZ4pHaWd_U",
  },
];

const resourcesCtas = [
  {
    label: "Join the community",
    to: "/marketing/community",
    variant: "default" as const,
  },
  {
    label: "Read latest updates",
    to: "/marketing/blog",
    variant: "outline" as const,
  },
];

const ResourcesSection = () => {
  return (
    <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a] overflow-hidden">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-50 via-slate-100/50 to-transparent dark:from-[#0a0e1a] dark:via-[#0a0e1a]/50 dark:to-transparent z-0 pointer-events-none" />
      
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
            Resources
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-6">
            Learn, build, and{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              connect
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
            Neutral cards and adaptive surfaces keep the experience on-brand in
            both light and dark themes.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, index) => {
            const Icon = resource.icon;

            return (
              <motion.a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noreferrer"
                className="h-full group"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}
                custom={0.1 + index * 0.05}
                variants={fadeUp}
                style={{ perspective: '1000px' }}
              >
                <TiltCard className="h-full rounded-2xl">
                  <Card className="flex h-full flex-col overflow-hidden rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300">
                    <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <Icon className="h-6 w-6" />
                        </span>
                        <Badge className="bg-blue-600 text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]">
                          {resource.chip}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        {resource.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          className="group"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={0.2}
          variants={fadeUp}
          style={{ perspective: '1000px' }}
        >
          <TiltCard className="rounded-2xl">
            <div className="rounded-[24px] border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl px-6 py-8 text-center shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300 sm:text-left">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Need hands-on support?
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Tap the community or follow the blog for new releases, playbooks,
                    and integration guides.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {resourcesCtas.map((cta) => (
                    <Button
                      key={cta.label}
                      asChild
                      variant={cta.variant}
                      size="lg"
                      className={
                        cta.variant === "outline"
                          ? "border-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-2xl"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)] rounded-2xl"
                      }
                    >
                      <RouterLink to={cta.to}>{cta.label}</RouterLink>
                    </Button>
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

export default ResourcesSection;
