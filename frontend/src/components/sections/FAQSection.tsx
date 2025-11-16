import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/TiltCard";

const fadeUp: any = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay,
      ease: [0.21, 0.82, 0.27, 1],
    },
  }),
};

const faqs = [
  {
    question: "How is Reputation DAO different from typical reputation systems?",
    answer:
      "Reputation DAO is a decentralized, tamper-proof reputation layer built on ICP. Rather than trusting opaque, platform-owned scoring, every action is cryptographically verified, stored on-chain, and owned by the contributor who earned it.",
  },
  {
    question: "Can my reputation be transferred or sold?",
    answer:
      "No. Reputation is soulbound to your identity. It cannot be traded, loaned, or abstracted away, which keeps ecosystems Sybil-resistant and ensures incentives stay aligned with authentic contribution.",
  },
  {
    question: "What platforms can integrate Reputation DAO?",
    answer:
      "Any DAO, DeFi protocol, marketplace, or Web2 community can tap into our SDKs and APIs. Reputation signals travel with the user, letting you gate access, automate incentives, or weight governance in any environment.",
  },
  {
    question: "Is Reputation DAO open-source?",
    answer:
      "Yes. The core contracts, scoring logic, and SDKs are open-source under a permissive license. Audit, extend, or fork the stack to fit the exact needs of your ecosystem.",
  },
  {
    question: "How does Reputation DAO handle privacy?",
    answer:
      "Selective disclosure and zero-knowledge friendly architecture let users prove what matters without exposing their entire history. Sensitive data stays minimized while trust signals stay verifiable.",
  },
  {
    question: "Can developers extend or build on top of Reputation DAO?",
    answer:
      "Absolutely. Compose new scoring modules, custom roles, and integrations. Reputation DAO is deliberately modular so teams can build bespoke trust layers without reinventing infrastructure.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a] overflow-hidden">
      {/* Smooth gradient transition from previous section */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-50 via-slate-100/50 to-transparent dark:from-[#0a0e1a] dark:via-[#0a0e1a]/50 dark:to-transparent z-0 pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-6 px-6 py-2.5 uppercase tracking-wide text-sm font-semibold border-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Sparkles className="mr-2 h-4 w-4" />
            Frequently asked questions
          </Badge>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
            Clarity around{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              decentralized reputation
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Everything you need to know before stitching Reputation DAO into
            your governance, incentive, or community flows.
          </p>
        </motion.div>

        <motion.div
          className="mt-16 group"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ perspective: '1000px' }}
        >
          <TiltCard className="space-y-4 rounded-[24px]">
            <div className="rounded-[24px] border border-blue-500/20 bg-card backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,102,255,0.1)] hover:shadow-[0_0_60px_rgba(0,102,255,0.2)] hover:border-blue-500/40 transition-all duration-300 sm:p-10">
              <Accordion type="single" collapsible defaultValue={faqs[0]?.question}>
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={faq.question}
                    className="border-b border-blue-500/10 last:border-b-0"
                  >
                    <AccordionTrigger className="text-left text-lg font-semibold text-foreground transition hover:text-blue-400 data-[state=open]:text-blue-400">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400 border border-blue-500/30">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TiltCard>
        </motion.div>

        <motion.div
          className="mt-12 group"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0.25}
          variants={fadeUp}
          style={{ perspective: '1000px' }}
        >
          <TiltCard>
            <Card className="rounded-[24px] border border-blue-500/30 bg-card backdrop-blur-xl shadow-[0_0_60px_rgba(0,102,255,0.15)] hover:shadow-[0_0_80px_rgba(0,102,255,0.25)] hover:border-blue-500/50 transition-all duration-300">
              <CardContent className="flex flex-col gap-8 p-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <HelpCircle className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Still have a question?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Drop into the community or connect with the core contributors
                    for architectural reviews, integration audits, or roadmap
                    alignment.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-3">
                <Button
                  size="lg"
                  className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:shadow-[0_0_60px_rgba(0,102,255,0.5)]"
                  asChild
                >
                  <RouterLink to="/marketing/community">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Talk to us
                  </RouterLink>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 min-w-[200px] border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  asChild
                >
                  <a
                    href="https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Browse resources
                  </a>
                </Button>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
