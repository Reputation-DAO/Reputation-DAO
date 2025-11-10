export const GridBackground = () => {
  return (
    <div className="absolute inset-0 opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 102, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 102, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridScroll 20s linear infinite',
        }}
      />
      <style>{`
        @keyframes gridScroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};
