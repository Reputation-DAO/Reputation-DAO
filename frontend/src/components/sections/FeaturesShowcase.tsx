import { motion } from "framer-motion";
import { Shield, Zap, Network, Lock, Users, TrendingUp } from "lucide-react";
import { WaveLines } from "@/components/ui/WaveLines";
import { useState, useRef } from "react";

const features = [
  {
    icon: Shield,
    title: "Immutable Trust",
    description: "Every reputation point is permanently recorded on-chain, creating an unalterable history of contributions and achievements.",
    metric: "100%",
    metricLabel: "Tamper-proof"
  },
  {
    icon: Zap,
    title: "Lightning Performance",
    description: "Query reputation scores in milliseconds. Built on ICP for instant verification without compromising decentralization.",
    metric: "<100ms",
    metricLabel: "Query time"
  },
  {
    icon: Network,
    title: "Fully Decentralized",
    description: "No single point of failure. Your reputation lives on a distributed network controlled by the community.",
    metric: "∞",
    metricLabel: "Uptime guarantee"
  }
];

const TiltCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowX(50);
    setGlowY(50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group h-full perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="h-full p-8 rounded-2xl border border-blue-500/20 bg-card/80 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col relative overflow-hidden"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
          boxShadow: `0 0 60px rgba(0, 102, 255, ${rotateX !== 0 || rotateY !== 0 ? 0.3 : 0.1})`,
        }}
      >
        {/* Glow effect that follows mouse */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle 200px at ${glowX}% ${glowY}%, rgba(0, 102, 255, 0.15), transparent)`,
            borderRadius: 'inherit',
          }}
        />
        
        <div className="text-center flex-1 flex flex-col relative z-10">
          <div className="inline-flex p-5 rounded-2xl bg-blue-500/10 text-blue-400 mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
            <feature.icon className="w-10 h-10" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4">
            {feature.title}
          </h3>
          
          <p className="text-muted-foreground leading-relaxed mb-auto">
            {feature.description}
          </p>
          
          <div className="pt-6 border-t border-blue-500/20 mt-8">
            <div className="text-4xl font-bold text-blue-400 mb-1">
              {feature.metric}
            </div>
            <div className="text-sm text-gray-500">
              {feature.metricLabel}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturesShowcase = () => {
  return (
    <section className="relative py-32 overflow-visible bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-background dark:via-background dark:to-background">
      {/* Wave lines background */}
      <div className="absolute inset-0 opacity-10 dark:opacity-20">
        <WaveLines color="#0066FF" lineCount={60} amplitude={80} frequency={0.002} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-foreground">
              Radically transforming trust,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">on-chain</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Building a marketplace of verifiable reputation that displaces legacy systems
            and empowers communities at each stage of the trust lifecycle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <TiltCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Additional info cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: Lock, label: "Soulbound", value: "Non-transferable identity" },
            { icon: Users, label: "Community-Owned", value: "Governed by members" },
            { icon: TrendingUp, label: "Composable", value: "Integrate anywhere" }
          ].map((item) => (
            <div
              key={item.label}
              className="relative group p-6 rounded-2xl border border-blue-500/20 bg-card/60 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-400 mb-1">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.value}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
