import { Shield, Zap, Network, Lock, Users, TrendingUp } from "lucide-react";
import { WaveLines } from "@/components/ui/WaveLines";
import { TiltCard } from "@/components/ui/TiltCard";

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

const FeaturesShowcase = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-visible bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a]">
      {/* Wave lines background */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <WaveLines color="#0066FF" lineCount={60} amplitude={80} frequency={0.002} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Product pillars</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
            Radically transforming trust,
            <span className="block bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">on-chain.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We pared the interface back to clean cards so your team can scan the core ideas quickly—no parallax, no tilt,
            only the information that matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <TiltCard
              key={feature.title}
              className="h-full bg-white/95 dark:bg-card/95 p-8 shadow-lg shadow-slate-200/70 dark:shadow-black/30 border border-border/70"
            >
              <div className="flex flex-col h-full text-center gap-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 grid place-items-center">
                  <feature.icon className="w-9 h-9" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-border/60">
                  <div className="text-3xl font-bold text-blue-500">{feature.metric}</div>
                  <p className="text-sm text-muted-foreground">{feature.metricLabel}</p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Lock, label: "Soulbound", value: "Non-transferable identity" },
            { icon: Users, label: "Community-owned", value: "Governed by members" },
            { icon: TrendingUp, label: "Composable", value: "Integrate anywhere" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-white/95 dark:bg-card/90 p-6 flex items-center gap-4 shadow-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 grid place-items-center">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
