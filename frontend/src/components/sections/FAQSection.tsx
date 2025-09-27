import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How is Reputation DAO different from typical reputation systems?",
      answer: "Reputation DAO is a decentralized, tamper-proof reputation layer built on the Internet Computer (ICP). Unlike traditional systems owned and controlled by centralized platforms, Reputation DAO ensures full transparency, censorship resistance, and verifiability. Users have cryptographic ownership of their reputation, and data is stored on-chain, not in opaque silos. No entity can modify, delete, or fabricate your reputation—only actions tied to your identity can affect it."
    },
    {
      question: "Can my reputation be transferred or sold?",
      answer: "No. Reputation within the DAO is soulbound, meaning it is intrinsically linked to your identity and cannot be transferred, sold, or manipulated for profit. This design prevents reputation farming, identity leasing, or reputation marketplaces, ensuring the integrity and authenticity of each individual's social proof. It reinforces accountability and resists Sybil attacks."
    },
    {
      question: "What platforms can integrate Reputation DAO?",
      answer: "Reputation DAO is designed to be modular and interoperable. Any decentralized or centralized platform—whether it's a DAO, DeFi protocol, decentralized marketplace, NFT platform, or even a Web2 site—can integrate the Reputation DAO protocol. The system provides APIs and SDKs that make integration seamless, allowing platforms to query user reputation scores and tailor access, trust levels, or benefits accordingly."
    },
    {
      question: "Is Reputation DAO open-source?",
      answer: "Yes. Reputation DAO is fully open-source under a permissive license, ensuring anyone can audit, contribute, or fork the protocol. The smart contracts, governance logic, scoring algorithms, and SDKs are all publicly available. Transparency is foundational to the project—it allows developers, users, and the broader ecosystem to verify that the protocol behaves exactly as described."
    },
    {
      question: "How does Reputation DAO handle privacy?",
      answer: "Reputation DAO balances transparency with user privacy through cryptographic methods such as zero-knowledge proofs and selective disclosure. While the scoring logic is public, sensitive user data is minimized or anonymized. Users can prove certain aspects of their reputation without revealing their full history. Future versions may include more advanced privacy-preserving mechanisms like ZK-SNARKs."
    },
    {
      question: "Can developers extend or build on top of Reputation DAO?",
      answer: "Absolutely. Reputation DAO is designed with extensibility in mind. Developers can create modules that plug into the core protocol, define custom scoring rules, or build new interfaces using the open APIs. You can also fork the core logic to suit your ecosystem's unique needs. Whether you're building a gated community, a credit system, or a merit-based rewards platform, the primitives are composable and developer-friendly."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Reputation DAO
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="glass-card overflow-hidden hover:shadow-[var(--shadow-glow)] transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-primary/5 transition-colors duration-300"
              >
                <h3 className="text-lg font-semibold text-foreground pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="p-6 pt-0 border-t border-border/50">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Contact section */}
        
      </div>
    </section>
  );
};

export default FAQSection;