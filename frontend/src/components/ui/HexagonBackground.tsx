export const HexagonBackground = () => {
  return (
    <div className="absolute inset-0 opacity-15">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
            <polygon 
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" 
              fill="none" 
              stroke="rgba(0, 102, 255, 0.3)" 
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)">
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="100 87"
            dur="30s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
};
