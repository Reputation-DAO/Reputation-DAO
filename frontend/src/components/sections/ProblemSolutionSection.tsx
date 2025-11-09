import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DotsBackground } from "@/components/ui/DotsBackground";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.21, 0.82, 0.27, 1] },
  }),
};

// +3 new statements; total = 7
const problemSignals = [
  "Opaque algorithms with no audit trail",
  "Governance capture by token whales",
  "Data loss or censorship from platform owners",
  "Reputation marketplaces and bot farming",
  "Reputation laundering via rented accounts",
  "Pay-to-play verification schemes",
  "Short-term farming incentives over real merit",
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
    <section className="relative z-10 py-24 md:py-32 bg-[#0d1220] overflow-hidden">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0d1220] via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Dots background pattern */}
      <DotsBackground />
      
      {/* Smooth gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#0d1220] z-0 pointer-events-none" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16 sm:px-10 lg:px-16">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0}
          variants={fadeUp}
        >
          <Badge className="mb-6 px-6 py-2.5 uppercase tracking-wide text-sm font-semibold border-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Sparkles className="mr-2 h-4 w-4" />
            The trust reset
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            Centralized reputation <span className="text-blue-400">breaks trust</span>.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              Reputation DAO rebuilds it.
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-gray-400">
            Most reputation systems are black boxes. We replace them with an open, verifiable fabric
            that communities govern together.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* PROBLEM */}
          <motion.div
            className="flex h-full group"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.1}
            variants={fadeUp}
            style={{ perspective: '1000px' }}
          >
            <TiltCard className="flex h-full flex-1">
              <Card className="flex h-full flex-1 flex-col overflow-hidden rounded-[20px] border-2 border-red-500/30 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.1)] hover:border-red-500/50 transition-all duration-300">
              <CardHeader className="flex flex-col gap-4 pb-0">
                <Badge variant="destructive" className="w-fit px-4 py-1.5 font-semibold">
                  Status quo
                </Badge>
                <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </span>
                  Centralized reputation
                </CardTitle>
              </CardHeader>

              {/* Tightened spacing so 7 bullets fit without scroll */}
              <CardContent className="flex flex-1 flex-col gap-5 pt-6 sm:gap-6">
                <p className="text-base leading-relaxed text-gray-300">
                  Closed algorithms, mutable scores, and third-party gatekeepers erode user trust and
                  expose communities to manipulation.
                </p>

                {/* Fixed 7-row grid ensures equal visual height */}
                <div className="grid flex-1 grid-rows-7 gap-2.5">
                  {problemSignals.map((signal) => (
                    <div
                      key={signal}
                      className="flex items-start gap-3 rounded-[4px] bg-red-500/5 border border-red-500/20 px-3.5 py-2.5 text-sm text-gray-300"
                    >
                      <span className="mt-0.5 text-red-400">•</span>
                      <span className="leading-snug">{signal}</span>
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>

          {/* SOLUTION */}
          <motion.div
            className="flex h-full group"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0.2}
            variants={fadeUp}
            style={{ perspective: '1000px' }}
          >
            <TiltCard className="flex h-full flex-1">
              <Card className="flex h-full flex-1 flex-col overflow-hidden rounded-[20px] border-2 border-blue-500/50 bg-[#0d1220]/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500 hover:shadow-[0_0_80px_rgba(0,102,255,0.3)] transition-all duration-300">
              <CardHeader className="flex flex-col gap-4 pb-0">
                <Badge className="w-fit bg-blue-600 text-white px-4 py-1.5 font-semibold shadow-[0_0_20px_rgba(0,102,255,0.3)]">Reputation DAO</Badge>
                <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  A verifiable trust fabric
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-5 pt-6 sm:gap-6">
                <p className="text-base leading-relaxed text-gray-300">
                  Reputation is earned, soulbound, and programmable. Users can audit the entire lifecycle,
                  and builders can automate trust without re-platforming.
                </p>

                <div className="grid flex-1 grid-rows-3 gap-3.5 sm:gap-4">
                  {solutionHighlights.map((highlight) => (
                    <div
                      key={highlight.title}
                      className="rounded-[6px] border border-blue-500/40 bg-blue-500/5 px-4 py-3.5 sm:py-4"
                    >
                      <h3 className="text-base font-semibold text-white">{highlight.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-300">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>
        </div>

        {/* Proof points */}
        <motion.div
          className="grid gap-4 rounded-[8px] border-2 border-blue-500/20 bg-[#0d1220]/80 backdrop-blur-xl px-6 py-6 shadow-lg sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0.3}
          variants={fadeUp}
        >
          {proofPoints.map((point) => (
            <div
              key={point}
              className="flex items-start gap-3 text-sm leading-relaxed text-gray-300"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
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
