'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  CheckCircle2,
  Sparkles,
  Compass,
  FileText,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { staggerContainer, staggerItem } from '@/lib/motion';

const ACTIVITY_STYLES: Record<string, { icon: React.ElementType, color: string, bg: string }> = {
  task: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  scenario: { icon: Compass, color: 'text-primary', bg: 'bg-primary/10' },
  resume: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  default: { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted' }
};

export default function ProgressPage() {
  const [stats, setStats] = useState({
    readinessScore: 0,
    totalSkills: 0,
    targetRole: 'Loading...',
    acquiredTargetSkills: 0,
    totalRequiredTargetSkills: 1,
    currentStreak: 0,
    recentActivity: [] as { text: string, time: string, type: string }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/progress');
        const json = await res.json();
        if (json.data) {
          setStats(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);
  return (
    <div className="px-8 py-12 md:px-10">
      <motion.div
        className="mx-auto max-w-5xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
          <p className="mt-1 text-muted-foreground">Track your career transition journey.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={staggerItem} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Readiness ({stats.targetRole})</p>
                <p className="text-xl font-bold">{loading ? '--' : `${stats.readinessScore}%`}</p>
              </div>
            </div>
            <Progress value={stats.readinessScore} className="mt-3 h-1.5" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Target Skills Acquired</p>
                <p className="text-xl font-bold">{loading ? '--' : `${stats.acquiredTargetSkills} / ${stats.totalRequiredTargetSkills}`}</p>
              </div>
            </div>
            <Progress value={stats.totalRequiredTargetSkills > 0 ? (stats.acquiredTargetSkills / stats.totalRequiredTargetSkills) * 100 : 0} className="mt-3 h-1.5" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-400/10">
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Total Skills Mapped</p>
                <p className="text-xl font-bold">{loading ? '--' : stats.totalSkills}</p>
              </div>
            </div>
            <Progress value={100} className="mt-3 h-1.5" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Streak</p>
                <p className="text-xl font-bold">{loading ? '--' : `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {[...Array(7)].map((_, i) => {
                // Determine if a day is active based on the current streak (visual representation for last 7 days)
                const isActive = i >= (7 - Math.min(stats.currentStreak, 7));
                return (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      isActive ? 'bg-amber-400' : 'bg-surface-2'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="mt-12">
          <h2 className="mb-6 text-xl font-semibold">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 && !loading ? (
              <div className="rounded-xl border border-border border-dashed bg-card/50 p-8 text-center text-muted-foreground text-sm">
                No recent activity found. Start a challenge or scenario!
              </div>
            ) : (
              stats.recentActivity.map((activity, i) => {
                const style = ACTIVITY_STYLES[activity.type] || ACTIVITY_STYLES.default;
                const Icon = style.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                      <Icon className={`h-5 w-5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{activity.time}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
