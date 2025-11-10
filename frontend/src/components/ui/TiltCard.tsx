import { useState, useRef, type ReactNode, type CSSProperties } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glowIntensity?: number;
  style?: CSSProperties;
}

export const TiltCard = ({ children, className = "", glowIntensity = 0.15, style }: TiltCardProps) => {
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setGlowX(50);
    setGlowY(50);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-[var(--shadow-card)] ${className}`}
      style={{
        transform: "none",
        transition: "none",
        ...style,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle 220px at ${glowX}% ${glowY}%, rgba(0, 102, 255, ${glowIntensity}), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};
