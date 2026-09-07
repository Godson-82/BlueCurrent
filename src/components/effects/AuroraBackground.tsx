import React from 'react';

// Pure-CSS aurora "depth glow" backdrop — a reactbits.dev Aurora inspired effect
// reimplemented without WebGL. Renders a few large, heavily-blurred radial
// blobs that slowly drift and breathe behind the app content. The existing
// dot-grid and noise overlays (.app-bg::before/::after) stay on top.
//
// Cheap on the GPU: only `transform` + `filter` are animated, no layout.

interface AuroraBackgroundProps {
  /** Global layer opacity (0..1). Keep low for a professional, subtle glow. */
  opacity?: number;
  /** Blur radius (px) applied to each blob. */
  blur?: number;
  /** Optional override colors: [r,g,b] tuples, 0..255. */
  colors?: Array<[number, number, number]>;
}

const DEFAULT_COLORS: Array<[number, number, number]> = [
  [0, 212, 170], // teal
  [59, 130, 246], // blue
  [34, 211, 238], // cyan
  [139, 92, 246], // faint purple
];

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  opacity = 0.5,
  blur = 90,
  colors = DEFAULT_COLORS,
}) => {
  return (
    <div className="aurora-bg" style={{ opacity }} aria-hidden="true">
      {colors.map(([r, g, b], i) => (
        <span
          key={i}
          className={`aurora-blob aurora-blob-${i + 1}`}
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${r},${g},${b},0.55), rgba(${r},${g},${b},0) 70%)`,
            filter: `blur(${blur}px)`,
          }}
        />
      ))}
    </div>
  );
};

export default AuroraBackground;
