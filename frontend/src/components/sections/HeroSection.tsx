import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LiquidEther from "../../../@/components/LiquidEther";
import { GlowingOrb } from "@/components/ui/GlowingOrb";

const HeroSection = () => {

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0e1a]">
      {/* Dark starfield background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1220] to-[#0d1220]" />
      
      {/* Animated stars */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, white, transparent),
                           radial-gradient(2px 2px at 60% 70%, white, transparent),
                           radial-gradient(1px 1px at 50% 50%, white, transparent),
                           radial-gradient(1px 1px at 80% 10%, white, transparent),
                           radial-gradient(2px 2px at 90% 60%, white, transparent),
                           radial-gradient(1px 1px at 33% 80%, white, transparent),
                           radial-gradient(1px 1px at 15% 90%, white, transparent)`,
          backgroundSize: '200% 200%',
          animation: 'twinkle 8s ease-in-out infinite'
        }} />
      </div>

      {/* Liquid Ether Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <LiquidEther 
          colors={['#0066FF', '#0080FF', '#00A3FF', '#001F3F']} 
          mouseForce={25}
          autoIntensity={3}
        />
      </div>

      {/* Glowing Orb - main focal point */}
      <div className="absolute inset-0 z-0 opacity-50">
        <GlowingOrb />
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 mb-10 rounded-full border border-blue-500/40 bg-blue-500/10 backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-400">Built on Internet Computer</span>
          </motion.div>

          {/* Main Headline with dramatic styling */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-7xl lg:text-9xl font-bold mb-8 leading-[1.1] tracking-tight relative z-10"
          >
            <span className="block text-white drop-shadow-[0_0_30px_rgba(0,102,255,0.5)]">
              Reputation
            </span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,102,255,0.5)]">
              DAO
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-base sm:text-lg lg:text-xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed"
          >
            Soulbound attestations. Immutable reputation. Decentralized governance.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-24"
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-[0_0_60px_rgba(0,102,255,0.4)] hover:shadow-[0_0_80px_rgba(0,102,255,0.6)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Get Started
                </span>
              </Button>
            </Link>
            
            <Link to="/docs">
              <Button 
                variant="outline" 
                size="lg"
                className="group border-2 border-blue-500/40 hover:border-blue-500 bg-transparent backdrop-blur-xl px-10 py-7 text-lg font-semibold rounded-2xl hover:bg-blue-500/10 transition-all duration-300 text-white"
              >
                <span className="flex items-center gap-3">
                  Explore Docs
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </motion.div>
          

        </motion.div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
