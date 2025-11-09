import { motion } from 'framer-motion';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface GlowingCard3DProps {
  children: ReactNode;
  className?: string;
}

export const GlowingCard3D = ({ children, className = '' }: GlowingCard3DProps) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="perspective-1000">
      <motion.div
        className={`relative ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Card content */}
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border-2 border-primary/30 rounded-2xl p-8 shadow-[0_0_80px_rgba(0,102,255,0.3)]">
          {/* Top light beam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 -translate-y-1/2">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-primary to-transparent opacity-80 blur-xl" />
          </div>
          
          {/* Bottom light beam */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 translate-y-1/2">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-primary to-transparent opacity-60 blur-xl" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
