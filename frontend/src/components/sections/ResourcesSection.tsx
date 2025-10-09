import { motion } from "framer-motion";
import { FileText, Headphones, Play } from "lucide-react";
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
    <section className="py-24 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 rounded-[32px] border border-border/80 bg-card/70 px-4 py-12 shadow-md backdrop-blur-sm sm:px-8 lg:px-12">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0}
          variants={fadeUp}
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2 uppercase tracking-wide">
            Resources
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Learn, build, and connect without visual friction
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
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
                className="h-full"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.45 }}
                custom={0.1 + index * 0.05}
                variants={fadeUp}
              >
                <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-border bg-background/70 shadow-lg shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <Badge className="bg-primary/90 text-primary-foreground">
                        {resource.chip}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {resource.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {resource.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          className="rounded-2xl border-2 border-border bg-background/70 px-6 py-8 text-center shadow-lg shadow-primary/5 sm:text-left"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          custom={0.2}
          variants={fadeUp}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">
                Need hands-on support?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
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
                      ? "border-primary/40 text-primary hover:bg-primary/10"
                      : undefined
                  }
                >
                  <RouterLink to={cta.to}>{cta.label}</RouterLink>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResourcesSection;
