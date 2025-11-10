import { useEffect, useRef } from 'react';

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  orbitSpeed: number;
}

export const ParticleRing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let rotation = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const createParticles = () => {
      particles = [];
      const particleCount = 150; // Reduced for cleaner look
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          angle: (i / particleCount) * Math.PI * 2,
          radius: 250 + Math.random() * 200, // Tighter spread: 250-450px
          speed: 0.0003 + Math.random() * 0.0008,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          orbitSpeed: 0.0002 + Math.random() * 0.0005
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw fewer, cleaner rings
      [0.7, 0.9, 1.1, 1.3].forEach((scale, ringIndex) => {
        particles.forEach((particle, i) => {
          // Update particle position
          particle.angle += particle.speed;
          
          const x = centerX + Math.cos(particle.angle + rotation * scale) * particle.radius * scale;
          const y = centerY + Math.sin(particle.angle + rotation * scale) * particle.radius * scale;
          
          // Only draw if within canvas bounds
          if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
          
          // Draw particle with subtle glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 3);
          gradient.addColorStop(0, `rgba(0, 102, 255, ${particle.opacity * (1 - ringIndex * 0.15)})`);
          gradient.addColorStop(0.5, `rgba(0, 102, 255, ${particle.opacity * 0.3 * (1 - ringIndex * 0.15)})`);
          gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Minimal connecting lines
      particles.forEach((particle, i) => {
        if (i % 15 !== 0) return; // Very selective connections
        
        const x1 = centerX + Math.cos(particle.angle + rotation) * particle.radius;
        const y1 = centerY + Math.sin(particle.angle + rotation) * particle.radius;
        
        // Only draw connections if particle is visible
        if (x1 < 0 || x1 > canvas.width || y1 < 0 || y1 > canvas.height) return;
        
        particles.slice(i + 1, i + 2).forEach(otherParticle => {
          const x2 = centerX + Math.cos(otherParticle.angle + rotation) * otherParticle.radius;
          const y2 = centerY + Math.sin(otherParticle.angle + rotation) * otherParticle.radius;
          
          const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(0, 102, 255, ${0.08 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      rotation += 0.0005; // Slower rotation
      animationFrameId = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
