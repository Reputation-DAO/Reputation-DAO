import { motion } from 'framer-motion';

export const CircuitLines = () => {
  const lines = [
    { x1: '10%', y1: '20%', x2: '40%', y2: '50%', delay: 0 },
    { x1: '90%', y1: '30%', x2: '60%', y2: '50%', delay: 0.2 },
    { x1: '20%', y1: '80%', x2: '40%', y2: '60%', delay: 0.4 },
    { x1: '80%', y1: '70%', x2: '60%', y2: '55%', delay: 0.6 },
  ];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 102, 255, 0)" />
          <stop offset="50%" stopColor="rgba(0, 102, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(0, 102, 255, 0)" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {lines.map((line, index) => (
        <g key={index}>
          <motion.line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: line.delay, ease: "easeInOut" }}
          />
          
          {/* Animated dot traveling along line */}
          <motion.circle
            r="4"
            fill="#0066FF"
            filter="url(#glow)"
            initial={{ 
              cx: line.x1, 
              cy: line.y1,
              opacity: 0 
            }}
            animate={{ 
              cx: [line.x1, line.x2, line.x1],
              cy: [line.y1, line.y2, line.y1],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3, 
              delay: line.delay + 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </g>
      ))}
    </svg>
  );
};
