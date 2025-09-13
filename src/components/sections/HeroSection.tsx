import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Zap, Shield, Network } from "lucide-react";
import { Link } from "react-router-dom";
import heroBackground from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/70" />
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-1">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary-glow/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-primary/5 rounded-full animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-primary-glow/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          {/* Floating Icons */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="glass-card p-4 rounded-2xl animate-float">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="glass-card p-4 rounded-2xl animate-float" style={{ animationDelay: '1s' }}>
              <Zap className="w-8 h-8 text-primary-glow" />
            </div>
            <div className="glass-card p-4 rounded-2xl animate-float" style={{ animationDelay: '2s' }}>
              <Network className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
              Trust, On-Chain.
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-glow to-primary bg-clip-text text-transparent">
              Forever.
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Soulbound, tamper-proof reputation built on ICP.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Get Started
              </Button>
            </Link>
            <a href="https://github.com/Reputation-DAO/Reputation-DAO" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="xl" className="group">
                <span>View GitHub</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="glass-card p-6 text-center hover-lift">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Immutable</div>
            </div>
            <div className="glass-card p-6 text-center hover-lift">
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Permanent</div>
            </div>
            <div className="glass-card p-6 text-center hover-lift">
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <div className="text-sm text-muted-foreground">Trusted Third Parties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;