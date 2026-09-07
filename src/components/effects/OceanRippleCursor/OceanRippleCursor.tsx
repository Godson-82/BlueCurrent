/**
 * OceanRippleCursor — lightweight CSS-only marine cursor trail.
 * Spawns expanding sonar-ring ripples along the cursor path,
 * like droplets on calm ocean water. Zero WebGL dependency.
 */
import { useEffect, useRef } from 'react';
import './OceanRippleCursor.css';

interface RippleDot {
  el: HTMLDivElement;
  removeTimer: ReturnType<typeof setTimeout>;
}

const MAX_DOTS = 14;
const SPAWN_INTERVAL_MS = 50;   // min ms between spawns (throttle)
const DOT_LIFETIME_MS = 1000;   // how long each dot lives

export default function OceanRippleCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<RippleDot[]>([]);
  const lastSpawnRef = useRef(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Remove oldest dots when we exceed the cap */
    const trimDots = () => {
      while (dotsRef.current.length > MAX_DOTS) {
        const oldest = dotsRef.current.shift();
        if (oldest) {
          oldest.el.classList.add('or-dot--fade');
          setTimeout(() => oldest.el.remove(), 200);
        }
      }
    };

    /** Spawn one ripple dot at (x, y) */
    const spawnDot = (x: number, y: number) => {
      const el = document.createElement('div');
      el.className = 'or-dot';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      // Slight size variance for organic feel
      const scale = 0.8 + Math.random() * 0.4;
      el.style.setProperty('--or-scale', String(scale));
      container.appendChild(el);

      const removeTimer = setTimeout(() => {
        el.classList.add('or-dot--fade');
        setTimeout(() => el.remove(), 300);
      }, DOT_LIFETIME_MS);

      dotsRef.current.push({ el, removeTimer });
      trimDots();
    };

    /** Throttled mousemove handler */
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawnRef.current < SPAWN_INTERVAL_MS) return;
      lastSpawnRef.current = now;

      spawnDot(e.clientX, e.clientY);
    };

    /** On click, burst a few extra rings for feedback */
    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => spawnDot(e.clientX, e.clientY), i * 80);
      }
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('click', onClick, { passive: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      // Cleanup all dots
      dotsRef.current.forEach((d) => {
        clearTimeout(d.removeTimer);
        d.el.remove();
      });
      dotsRef.current = [];
    };
  }, []);

  return <div ref={containerRef} className="ocean-ripple-cursor" />;
}
