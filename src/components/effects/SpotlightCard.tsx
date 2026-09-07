import React, { useRef, useState } from 'react';

// Cursor-following spotlight card — adapted from reactbits.dev's SpotlightCard
// (which is dependency-free) and restyled to BlueCurrent's `surface-card`
// language. A soft radial glow follows the pointer inside the card.
//
// Use: <SpotlightCard className="surface-card" spotlightColor="rgba(0,212,170,0.14)">…</SpotlightCard>

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 212, 170, 0.14)',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = divRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(0.6)}
      onMouseLeave={() => setOpacity(0)}
      onFocus={() => setOpacity(0.6)}
      onBlur={() => setOpacity(0)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 45%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
