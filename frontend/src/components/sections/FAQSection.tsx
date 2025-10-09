import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Sparkles } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
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
    <section className="relative z-10 py-6 md:py-7">
      <div className="mx-auto max-w-6xl rounded-[16px] border border-border/80 bg-card/70 px-4 py-12 shadow-md backdrop-blur-sm sm:px-8 lg:px-12">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          custom={0}
          variants={fadeUp}
        >
          <Badge variant="secondary" className="mb-5 px-4 py-2 uppercase tracking-wide">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Frequently asked questions
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Clarity around{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary-foreground bg-clip-text text-transparent">
              decentralized reputation
            </span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Everything you need to know before stitching Reputation DAO into
            your governance, incentive, or community flows.
          </p>
        </motion.div>

        <motion.div
          className="mt-16 space-y-4 rounded-[8px] border-2 border-border bg-background/70 p-6 shadow-lg shadow-primary/5 sm:p-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0.15}
          variants={fadeUp}
        >
          <Accordion type="single" collapsible defaultValue={faqs[0]?.question}>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className="border-b border-primary/10 last:border-b-0"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground transition hover:text-primary data-[state=open]:text-primary">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
        </motion.div>

        <motion.div
          className="mt-12"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.45 }}
          custom={0.25}
          variants={fadeUp}
        >
          <Card className="rounded-[12px] border-2 border-border bg-background/70 shadow-lg shadow-primary/5">
            <CardContent className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] bg-primary/15 text-primary">
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
                  className="flex-1 min-w-[200px] shadow-[0_18px_45px_-35px_rgba(24,90,219,0.95)]"
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
                  className="flex-1 min-w-[200px] border-primary/40 text-primary hover:bg-primary/10"
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
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
