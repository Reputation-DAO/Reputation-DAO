import { motion } from 'framer-motion';

export const GlowingOrb = () => {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {/* Main orb - clean and centered */}
      <motion.div
        className="relative w-[600px] h-[600px]"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Core glow - smooth gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-blue-500/30 via-blue-600/10 to-transparent blur-3xl" />
        <div className="absolute inset-20 rounded-full bg-gradient-radial from-blue-400/40 via-blue-500/15 to-transparent blur-2xl" />
        <div className="absolute inset-40 rounded-full bg-gradient-radial from-white/20 via-blue-300/10 to-transparent blur-xl" />
        
        {/* Subtle outer rings */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-blue-400/10"
            style={{
              width: `${100 + i * 40}%`,
              height: `${100 + i * 40}%`,
              left: `${-i * 20}%`,
              top: `${-i * 20}%`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.05, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

    </div>
  );
};
