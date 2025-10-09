import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Zap, Shield, Network } from "lucide-react";
import { Link } from "react-router-dom";
import LiquidEther from "../../../@/components/LiquidEther";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Liquid Ether Background */}
      <div className="fixed inset-0 z-0">
        <LiquidEther
          colors={['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={20}
          iterationsViscous={32}
          iterationsPoisson={32}
          dt={0.014}
          BFECC={true}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={3}
          takeoverDuration={0.1}
          autoResumeDelay={1000}
          autoRampDuration={0.3}
        />
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          {/* Floating Icons */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="glass-card p-4 rounded-[8px] animate-float">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="glass-card p-4 rounded-[8px] animate-float" style={{ animationDelay: '1s' }}>
              <Zap className="w-8 h-8 text-primary-glow" />
            </div>
            <div className="glass-card p-4 rounded-[8px] animate-float" style={{ animationDelay: '2s' }}>
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
