import { Shield, Globe, Link, Clock, TrendingUp, Zap } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      title: "Immutable",
      description: "Built on blockchain, your reputation cannot be tampered with or erased. Every action you take remains secure and transparent.",
      icon: Shield,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Decentralized", 
      description: "No single entity controls your reputation. Ownership stays with the user, aligned with web3 principles of freedom and transparency.",
      icon: Globe,
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Interoperable",
      description: "Your reputation seamlessly integrates across platforms, enhancing trust and consistency wherever you participate.",
      icon: Link,
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Permanent",
      description: "Once earned, your reputation is permanently recorded on-chain, providing a lasting record of your contributions.",
      icon: Clock,
      gradient: "from-orange-500 to-orange-600"
    },
    {
      title: "Earnable",
      description: "Reputation isn't given — it's earned. Every action, contribution, or endorsement boosts your on-chain identity.",
      icon: TrendingUp,
      gradient: "from-pink-500 to-pink-600"
    },
    {
      title: "Synergistic",
      description: "Works alongside DAOs, platforms, and ecosystems to supercharge governance, rewards, and trust without extra friction.",
      icon: Zap,
      gradient: "from-primary to-primary-glow"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Why Reputation DAO?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of decentralized reputation with these core benefits
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={benefit.title} 
                className="glass-card p-8 hover-lift group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:animate-pulse-glow transition-all duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                  
                  {/* Hover decoration */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl -z-10" />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="glass-card p-10 max-w-4xl mx-auto border border-primary/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-3xl font-bold mb-4 text-foreground">
                  Build Trust That Lasts
                </h3>
                <p className="text-muted-foreground text-lg">
                  Your actions create permanent, verifiable proof of your contributions to the decentralized ecosystem.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)] font-semibold">
                  Start Building
                </button>
                <button className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all duration-300 font-semibold">
                  View Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;