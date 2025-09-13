import { AlertTriangle, CheckCircle } from "lucide-react";

const ProblemSolutionSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Problem vs. Solution
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Problem Card */}
          <div className="glass-card p-8 lg:p-10 hover-lift group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center group-hover:animate-pulse-glow">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">The Problem</h3>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-lg">
              Reputation today is controlled by centralized platforms. It is opaque, prone to bias, 
              easily manipulated, and offers no verifiable transparency to its users. These systems 
              are vulnerable to censorship, data loss, and manipulation from centralized authorities.
            </p>
            
            {/* Problem indicators */}
            <div className="mt-6 space-y-3">
              {[
                'Centralized control',
                'Opaque algorithms',
                'Vulnerable to censorship',
                'Easily manipulated'
              ].map((issue, index) => (
                <div key={index} className="flex items-center gap-3 text-destructive/80">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span className="text-sm">{issue}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Solution Card */}
          <div className="glass-card p-8 lg:p-10 hover-lift group border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:animate-pulse-glow">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Our Solution</h3>
            </div>
            
            <p className="text-muted-foreground leading-relaxed text-lg">
              Reputation DAO offers a decentralized, transparent, and immutable reputation protocol 
              built on ICP. Your reputation is tamper-proof, censorship-resistant, and entirely 
              verifiable — putting ownership and trust where it belongs: with the user and the community.
            </p>
            
            {/* Solution benefits */}
            <div className="mt-6 space-y-3">
              {[
                'Fully decentralized',
                'Transparent & verifiable',
                'Censorship-resistant',
                'User-owned identity'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-primary">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;