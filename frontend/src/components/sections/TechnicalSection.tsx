import { Server, Shield, Eye, Globe, Code } from "lucide-react";

const TechnicalSection = () => {
  const technicalPoints = [
    {
      number: "01",
      title: "Powered by ICP",
      description: "Harnessing the next-generation Internet Computer Protocol for limitless scalability, near-instant execution, and censorship resistance — built for the future of decentralized reputation. The protocol ensures data permanence, blazing-fast interactions, and eliminates the need for centralized cloud providers, making the infrastructure truly sovereign.",
      icon: Server,
      accent: "from-blue-500 to-blue-600"
    },
    {
      number: "02", 
      title: "Soulbound & Permanent",
      description: "Your reputation is non-transferable, cryptographically bound to your identity. Immutable, fraud-proof, and forever tied to your contributions — not your wallet. This ensures that reputation remains a true reflection of behavior over time, immune to gaming, trading, or artificial inflation.",
      icon: Shield,
      accent: "from-emerald-500 to-emerald-600"
    },
    {
      number: "03",
      title: "Fully Open. Verifiable. On-Chain.",
      description: "Every action is transparently stored on-chain. Auditable by anyone, trustless by design. No hidden algorithms, no opaque scores — just pure, provable data. The system enables public access to reputation logs, creating a transparent meritocracy across decentralized communities and platforms.",
      icon: Eye,
      accent: "from-purple-500 to-purple-600"
    },
    {
      number: "04",
      title: "Interoperable by Default",
      description: "Designed to integrate seamlessly across protocols, platforms, and ecosystems — enabling your reputation to travel with you anywhere on the decentralized web. From DAOs to marketplaces, your identity becomes a trusted passport, streamlining access and building bridges between siloed systems.",
      icon: Globe,
      accent: "from-orange-500 to-orange-600"
    },
    {
      number: "05",
      title: "Programmable Reputation Logic",
      description: "Reputation becomes a building block for automation. Smart contracts can read, verify, and act on trust signals without relying on third-party intermediaries. This paves the way for fully autonomous governance, access control, and rewards systems that adapt in real time to provable trust data.",
      icon: Code,
      accent: "from-primary to-primary-glow"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Technical Overview
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built on cutting-edge blockchain technology for the future of trust
          </p>
        </div>
        
        <div className="space-y-12">
          {technicalPoints.map((point, index) => {
            const IconComponent = point.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div 
                key={point.number}
                className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${point.accent} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{point.number}</span>
                    </div>
                    <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-transparent" />
                    <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
                      {point.title}
                    </h3>
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {point.description}
                  </p>
                </div>
                
                {/* Visual */}
                <div className="flex-1 max-w-md">
                  <div className="glass-card p-12 text-center hover-lift group">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${point.accent} flex items-center justify-center group-hover:animate-pulse-glow`}>
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-2 bg-primary/20 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-1000"
                          style={{ width: `${90 - index * 10}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Security</span>
                        <span>{90 - index * 10}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom showcase */}
        <div className="mt-20">
          <div className="glass-card p-10 border border-primary/20">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Developer Ready
              </h3>
              <p className="text-lg text-muted-foreground">
                Comprehensive tools and documentation to integrate Reputation DAO into your project
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Code className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">APIs & SDKs</h4>
                <p className="text-sm text-muted-foreground">Easy integration with comprehensive documentation</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Cross-Platform</h4>
                <p className="text-sm text-muted-foreground">Works across all major blockchain platforms</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Enterprise Grade</h4>
                <p className="text-sm text-muted-foreground">Battle-tested security and reliability</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSection;