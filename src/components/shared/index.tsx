'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { TiltCard } from '@/components/ui/tilt-card';

/* ─── Skill Badge ─── */
interface SkillBadgeProps {
  name: string;
  category?: string;
  acquired?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function SkillBadge({ name, category, acquired = true, size = 'sm', onClick }: SkillBadgeProps) {
  const base = onClick ? 'cursor-pointer' : '';
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border font-medium transition-all ${base} ${sizeClass} ${
        acquired
          ? 'border-primary/20 bg-primary/8 text-primary hover:bg-primary/15'
          : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/10'
      }`}
    >
      {name}
      {category && <span className="text-[8px] opacity-50">{category}</span>}
    </button>
  );
}

/* ─── Status Badge ─── */
interface StatusBadgeProps {
  status: 'completed' | 'in_progress' | 'locked' | 'active';
  label?: string;
}

const statusStyles = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  active: 'bg-primary/10 text-primary border-primary/20',
  locked: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
};

const statusLabels = {
  completed: 'Completed',
  in_progress: 'In Progress',
  active: 'Active',
  locked: 'Locked',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[status]}`}>
      {status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {label || statusLabels[status]}
    </span>
  );
}

/* ─── Glass Card ─── */
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function GlassCard({ children, className = '', hoverable = false }: GlassCardProps) {
  return (
    <div className={`card-glass ${hoverable ? '' : ''} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Empty State ─── */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 btn-glass text-xs">{action.label}</a>
        ) : (
          <button onClick={action.onClick} className="mt-4 btn-glass text-xs">{action.label}</button>
        )
      )}
    </motion.div>
  );
}

/* ─── Skeleton ─── */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-md shimmer t-shimmer ${className}`} data-text="" />;
}

/* ─── Animated Digit Helper ─── */
export function AnimatedDigit({ value, animateOnMount = true }: { value: number | string, animateOnMount?: boolean }) {
  const [isAnimating, setIsAnimating] = useState(animateOnMount);
  
  useEffect(() => {
    if (animateOnMount) {
      // Force a tiny delay to ensure the DOM paints before animation starts
      const t = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(t);
    }
  }, [animateOnMount, value]); // Re-animate on value change

  const str = String(value);
  return (
    <span className={`t-digit-group ${isAnimating ? 'is-animating' : ''}`}>
      {str.split('').map((char, i) => (
        <span key={i} className="t-digit" data-stagger={(i % 3) + 1}>
          {char}
        </span>
      ))}
    </span>
  );
}

/* ─── Stat Card ─── */
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor?: string;
  iconBg?: string;
  progress?: number;
}

export function StatCard({ icon: Icon, label, value, subtext, iconColor = 'text-primary', iconBg = 'bg-primary/10', progress }: StatCardProps) {
  return (
    <TiltCard className="h-full">
      <div className="card-interactive h-full bg-card/60 backdrop-blur-md hover:bg-card/70 border-border/40">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
        </div>
        {subtext && <p className="mt-2 text-[10px] text-muted-foreground">{subtext}</p>}
        {progress !== undefined && (
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        )}
      </div>
    </TiltCard>
  );
}

/* ─── Page Skeleton ─── */
export function PageSkeleton() {
  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
