import React, { useEffect, useRef, useState } from 'react';

// Dependency-free count-up — a reactbits.dev CountUp inspired effect that
// replaces the framer-motion version. Eases toward `to` with requestAnimationFrame
// once the element scrolls into view.

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // seconds
  delay?: number; // seconds before starting after entering view
  prefix?: string;
  suffix?: string;
  separator?: boolean; // group thousands with commas
  decimals?: number;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  duration = 1.6,
  delay = 0,
  prefix = '',
  suffix = '',
  separator = false,
  decimals = 0,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(() => from.toFixed(decimals));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      const [int, frac] = fixed.split('.');
      const grouped = separator ? Number(int).toLocaleString('en-US') : int;
      return frac ? `${grouped}.${frac}` : grouped;
    };

    let raf = 0;
    let started = false;
    let startTime = 0;

    const animate = (time: number) => {
      if (startTime === 0) startTime = time;
      const elapsed = (time - startTime) / 1000;
      const p = Math.min(elapsed / duration, 1);
      const value = from + (to - from) * easeOutCubic(p);
      setDisplay(format(value));
      if (p < 1) raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          setTimeout(() => {
            raf = requestAnimationFrame(animate);
          }, delay * 1000);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration, delay, separator, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default CountUp;
