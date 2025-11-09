import { useEffect, useRef } from 'react';

interface WaveLinesProps {
  color?: string;
  lineCount?: number;
  amplitude?: number;
  frequency?: number;
}

export const WaveLines = ({ 
  color = '#0066FF', 
  lineCount = 80,
  amplitude = 100,
  frequency = 0.003
}: WaveLinesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < lineCount; i++) {
        const yOffset = (i - lineCount / 2) * 3;
        const opacity = 1 - Math.abs(i - lineCount / 2) / (lineCount / 2);
        
        ctx.beginPath();
        ctx.strokeStyle = `${color}${Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = centerY + yOffset + Math.sin(x * frequency + offset + i * 0.1) * amplitude * opacity;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
      
      offset += 0.02;
      animationFrameId = requestAnimationFrame(drawWaves);
    };

    resizeCanvas();
    drawWaves();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color, lineCount, amplitude, frequency]);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />;
};
