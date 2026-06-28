'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReadinessGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const SIZES = {
  sm: { diameter: 80, stroke: 6, fontSize: 'text-lg', labelSize: 'text-[9px]' },
  md: { diameter: 120, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-[10px]' },
  lg: { diameter: 160, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-xs' },
};

export function ReadinessGauge({ score, size = 'md', showLabel = true, animated = true }: ReadinessGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = SIZES[size];
  const radius = (config.diameter - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const center = config.diameter / 2;

  useEffect(() => {
    if (!animated) { setDisplayScore(score); return; }
    let frame: number;
    const duration = 800;
    const start = performance.now();
    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  const getColor = (s: number) => {
    if (s >= 40) return { stroke: 'var(--primary)', glow: 'var(--ardent-glow)' };
    if (s >= 20) return { stroke: 'var(--warning)', glow: 'hsla(38,92%,50%,0.2)' };
    return { stroke: 'var(--destructive)', glow: 'hsla(0,84%,60%,0.2)' };
  };
  const colors = getColor(score);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={config.diameter} height={config.diameter} className="transform -rotate-90">
        <defs>
          <filter id={`glow-${size}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={config.stroke} />
        <motion.circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={colors.stroke} strokeWidth={config.stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          filter={`url(#glow-${size})`}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${config.fontSize} font-bold tabular-nums`}>
          {displayScore}<span className="text-muted-foreground" style={{ fontSize: '0.5em' }}>%</span>
        </span>
        {showLabel && <span className={`${config.labelSize} text-muted-foreground -mt-0.5`}>Readiness</span>}
      </div>
    </div>
  );
}
