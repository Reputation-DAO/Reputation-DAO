import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";
import { Banknote, Activity, Users2, Timer } from "lucide-react";

const StatCard = ({
  icon: Icon,
  label,
  value,
  prefix,
  suffix,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ delay, duration: 0.5 }}
    className="cyber-card p-5 sm:p-6 flex items-center gap-4"
  >
    <div className="h-12 w-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(0,102,255,0.3)]">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-white">
        {prefix}
        <AnimatedCounter to={value} duration={1.2} className="tabular-nums" />
        {suffix}
      </div>
    </div>
  </motion.div>
);

const DeFiStatsStrip = () => {
  return (
    <section className="relative z-10 -mt-8 sm:-mt-12"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Banknote} label="Total Value Locked" value={12} prefix="$" suffix=".34M" />
          <StatCard icon={Activity} label="24h Transactions" value={1240} suffix="k" delay={0.05} />
          <StatCard icon={Users2} label="Organizations" value={128} delay={0.1} />
          <StatCard icon={Timer} label="Avg. Finality" value={2} suffix=".1s" delay={0.15} />
        </div>
      </div>
    </section>
  );
};

export default DeFiStatsStrip;
