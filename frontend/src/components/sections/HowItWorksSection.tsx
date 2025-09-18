import { Trophy, UserCheck, Unlock } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      title: "Earn Reputation",
      description: "Contribute to communities and real-world projects. Every meaningful action — whether it's sharing knowledge, building tools, or helping others — is permanently and transparently recorded on-chain as proof of your contribution.",
      icon: Trophy,
      color: "from-primary to-primary-glow"
    },
    {
      number: "2", 
      title: "Soulbound Identity",
      description: "Your reputation is soulbound — uniquely tied to your identity. It cannot be transferred, bought, or sold, ensuring it reflects only your verifiable efforts and interactions across trusted networks.",
      icon: UserCheck,
      color: "from-primary-glow to-primary"
    },
    {
      number: "3",
      title: "Unlock Opportunities", 
      description: "Leverage your on-chain reputation to unlock high-trust environments: gain access to exclusive DAOs, governance roles, gated communities, and projects that require credible contributors.",
      icon: Unlock,
      color: "from-primary to-primary-glow"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple three-step process to build your decentralized reputation
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.number} 
                className="relative group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent transform translate-x-6 z-0" />
                )}
                
                <div className="glass-card p-8 text-center hover-lift relative z-10 h-full">
                  {/* Step number */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-bold animate-pulse-glow`}>
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-12 h-12 mx-auto mb-4 text-primary animate-float">
                    <IconComponent className="w-full h-full" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Hover effect decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Ready to build your reputation?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join the future of trust and start earning verifiable reputation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-lg hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)]">
                Get Started
              </button>
              <button className="px-8 py-3 border border-primary/20 text-primary rounded-lg hover:bg-primary/5 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;