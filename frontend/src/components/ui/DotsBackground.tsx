export const DotsBackground = () => {
  return (
    <div className="absolute inset-0 opacity-30">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0, 102, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          animation: 'dotsFloat 15s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes dotsFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
