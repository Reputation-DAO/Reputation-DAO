import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

const problemSignals = [
  "Opaque algorithms with no audit trail",
  "Governance capture by token whales",
  "Data loss or censorship from platform owners",
  "Reputation marketplaces and bot farming",
];

const solutionHighlights = [
  {
    title: "Verifiable by design",
    description:
      "Every contribution is attested on-chain and owned by the individual who earned it. Scoring logic is open, reviewable, and portable.",
  },
  {
    title: "Community-owned trust",
    description:
      "Decentralized controls prevent unilateral censorship or forced resets. Reputation signals travel with members across ecosystems.",
  },
  {
    title: "Programmable guardrails",
    description:
      "Smart contracts consume reputation natively, unlocking gated access, incentives, and governance without brittle spreadsheets.",
  },
];

const proofPoints = [
  "Soulbound attestations eliminate pay-to-play loopholes.",
  "ICP canisters provide uptime, sovereignty, and low-latency writes.",
  "Zero-knowledge friendly architecture keeps proofs private-yet-verifiable.",
];

const ProblemSolutionSection = () => {
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
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            The trust reset
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Centralized reputation breaks trust. Reputation DAO rebuilds it.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground/90">
            Most reputation rails are black boxes. We replace them with an open,
            verifiable fabric that communities govern together.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <motion.div
            className="flex h-full"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.1}
            variants={fadeUp}
          >
            <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-border bg-background shadow-xl">
              <CardHeader className="flex flex-col gap-3 pb-0">
                <Badge variant="destructive" className="w-fit">
                  Status quo
                </Badge>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  Centralized reputation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-6 pt-6">
                <p className="text-base leading-relaxed text-muted-foreground/90">
                  Closed algorithms, mutable scores, and third-party gatekeepers
                  erode user trust and expose communities to manipulation.
                </p>
                <div className="flex flex-1 flex-col justify-between space-y-3">
                  {problemSignals.map((signal) => (
                    <div
                      key={signal}
                      className="flex items-start gap-3 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 text-destructive">•</span>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="flex h-full"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.2}
            variants={fadeUp}
          >
            <Card className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-background shadow-xl">
              <CardHeader className="flex flex-col gap-3 pb-0">
                <Badge className="w-fit bg-primary/90 text-primary-foreground">
                  Reputation DAO
                </Badge>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  A verifiable trust fabric
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-6 pt-6">
                <p className="text-base leading-relaxed text-muted-foreground/90">
                  Reputation is earned, soulbound, and programmable. Users can
                  audit the entire lifecycle, and builders can automate trust
                  without re-platforming.
                </p>
                <div className="flex flex-1 flex-col justify-between space-y-4">
                  {solutionHighlights.map((highlight) => (
                    <div
                      key={highlight.title}
                      className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-4"
                    >
                      <h3 className="text-base font-semibold text-foreground">
                        {highlight.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground/90">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-4 rounded-2xl border-2 border-border bg-background px-6 py-6 shadow-lg sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0.3}
          variants={fadeUp}
        >
          {proofPoints.map((point) => (
            <div key={point} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
              </span>
              <span>{point}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
