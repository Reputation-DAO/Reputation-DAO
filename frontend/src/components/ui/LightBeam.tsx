import { motion } from 'framer-motion';

export const LightBeam = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Vertical light beam */}
      <motion.div
        className="absolute left-1/2 top-0 w-1 h-full -translate-x-1/2"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-40 blur-sm" />
      </motion.div>
      
      {/* Glow at center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl" />
      </motion.div>
      
      {/* Horizontal light rays */}
      {[-20, 0, 20].map((offset, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{ top: `calc(50% + ${offset}px)` }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.3, scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.8 + i * 0.1 }}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        </motion.div>
      ))}
    </div>
  );
};
