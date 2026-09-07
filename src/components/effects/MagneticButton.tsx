import React, { useRef, useState } from 'react';

// Cursor-attracted button wrapper — a reactbits.dev Magnet inspired effect,
// dependency-free. The wrapped element nudges toward the pointer on hover and
// springs back on leave. Use with a single child (button, link, etc.).

interface MagneticButtonProps {
  children: React.ReactElement;
  /** Max translate (px) the element can pull toward the cursor. */
  strength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 6,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('translate(0px, 0px)');

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    const max = strength;
    // Normalize to [-1, 1] then scale; clamp so it stays subtle.
    const x = Math.max(-max, Math.min(max, relX * 0.1));
    const y = Math.max(-max, Math.min(max, relY * 0.1));
    setTransform(`translate(${x}px, ${y}px)`);
  };

  const reset = () => setTransform('translate(0px, 0px)');

  return (
    <div
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)', transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
