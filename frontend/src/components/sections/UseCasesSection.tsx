import governanceIcon from "@/assets/governance.png";
import defiIcon from "@/assets/defi.png";
import identityIcon from "@/assets/defi.png";

const UseCasesSection = () => {
  const useCases = [
    {
      title: "DAOs & Governance",
      description: "Fair voting power based on earned reputation, not token wealth. Protect governance integrity.",
      image: governanceIcon,
      features: ["Merit-based voting", "Prevent governance attacks", "Fair decision making", "Community-driven"]
    },
    {
      title: "DeFi & Protocols", 
      description: "Establish trust layers on-chain for credit scoring, under-collateralized loans, and more.",
      image: defiIcon,
      features: ["Credit scoring", "Under-collateralized loans", "Risk assessment", "Trust verification"]
    },
    {
      title: "Social & Identity",
      description: "Portable, proof-based identity for creators, contributors, and communities.",
      image: identityIcon,
      features: ["Portable identity", "Creator verification", "Community trust", "Social proof"]
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-light/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Where Reputation DAO Fits
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transforming trust across the decentralized ecosystem
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={useCase.title} 
              className="glass-card p-8 hover-lift group"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Image */}
              <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary-glow/5">
                <img 
                  src={useCase.image} 
                  alt={useCase.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                {useCase.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {useCase.description}
              </p>
              
              {/* Features list */}
              <div className="space-y-2">
                {useCase.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full group-hover:animate-pulse" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Call to action */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <button className="text-primary font-semibold hover:underline transition-all duration-300 group-hover:text-primary-glow">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Integration showcase */}
        <div className="mt-20">
          <div className="glass-card p-10 text-center">
            <h3 className="text-3xl font-bold mb-6 text-foreground">
              Seamless Integration
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Built for interoperability, Reputation DAO works with your existing infrastructure 
              and favorite platforms across the decentralized web.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Web3 Wallets', 'Smart Contracts', 'DApps', 'APIs', 'SDKs'].map((integration, index) => (
                <div 
                  key={integration} 
                  className="px-6 py-3 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {integration}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;