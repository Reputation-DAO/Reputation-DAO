import { useEffect, useState } from "react";
import { motion, useMotionValue, animate, useMotionValueEvent } from "framer-motion";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  formatter?: (v: number) => string;
  className?: string;
}

export const AnimatedCounter = ({ from = 0, to, duration = 1.2, formatter, className }: AnimatedCounterProps) => {
  const mv = useMotionValue(from);
  const [display, setDisplay] = useState<number>(from);

  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [to, duration, mv]);

  useMotionValueEvent(mv, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  return (
    <motion.span className={className}>
      {formatter ? formatter(display) : display.toString()}
    </motion.span>
  );
};

export default AnimatedCounter;
