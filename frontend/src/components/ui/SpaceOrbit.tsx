import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OrbitNode {
  label: string;
  value: string;
  angle: number;
  radius: number;
  icon?: string;
}

interface SpaceOrbitProps {
  nodes?: OrbitNode[];
}

export const SpaceOrbit = ({ nodes = [] }: SpaceOrbitProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawOrbit = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw multiple orbit rings
      [0.3, 0.5, 0.7].forEach((scale, index) => {
        const radius = Math.min(canvas.width, canvas.height) * scale;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 102, 255, ${0.1 - index * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw orbit dots
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 2 + rotation * (index % 2 === 0 ? 1 : -1) * 0.5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 102, 255, ${0.2 + Math.sin(rotation + i) * 0.1})`;
          ctx.fill();
        }
      });
      
      rotation += 0.002;
      animationFrameId = requestAnimationFrame(drawOrbit);
    };

    resizeCanvas();
    drawOrbit();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Orbital nodes */}
      {nodes.map((node, index) => (
        <motion.div
          key={node.label}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${node.angle}deg) translateX(${node.radius}px) rotate(-${node.angle}deg)`
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2, duration: 0.6 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-300" />
            <div className="relative bg-background/80 backdrop-blur-xl border border-primary/30 rounded-2xl px-4 py-3 hover:border-primary/60 transition-all duration-300">
              <div className="flex items-center gap-2">
                {node.icon && <span className="text-xl">{node.icon}</span>}
                <div>
                  <div className="text-xs text-muted-foreground">{node.label}</div>
                  <div className="text-sm font-semibold text-foreground">{node.value}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
