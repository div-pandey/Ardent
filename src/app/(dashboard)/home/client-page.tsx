'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Route,
  ArrowRight,
  Zap,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Star,
  Swords,
  Mic,
  Terminal,
  Map,
  Flame,
  Target,
  CalendarDays,
  ChevronRight,
  BarChart3,
  BookOpen,
  Award,
} from 'lucide-react';
import { ReadinessGauge } from '@/components/shared/readiness-gauge';
import { AnimatedDigit } from '@/components/shared';
import { CertificateModal } from '@/components/shared/certificate-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as any } },
};
const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

interface ActiveMilestoneData {
  title: string;
  description: string;
  weekRange: string;
  tasks: { title: string; done: boolean }[];
  skills: string[];
  roadmapTitle: string;
  roadmapId: string;
  milestoneId: string;
  totalMilestones: number;
  completedMilestones: number;
}

const quickActions = [
  {
    icon: Sparkles, label: 'Career Graph', description: 'Explore your skill constellation',
    href: '/graph', color: 'text-primary', bg: 'bg-primary/10', borderColor: 'border-primary/20',
  },
  {
    icon: Swords, label: 'Daily Challenges', description: 'Complete your micro-goals',
    href: '/challenges', color: 'text-amber-400', bg: 'bg-amber-400/10', borderColor: 'border-amber-400/20',
  },
  {
    icon: Mic, label: 'Mock Interviews', description: 'Practice with AI hiring manager',
    href: '/interviews', color: 'text-blue-400', bg: 'bg-blue-400/10', borderColor: 'border-blue-400/20',
  },
  {
    icon: Map, label: 'Adaptive Roadmap', description: 'Continue your learning plan',
    href: '/roadmap', color: 'text-emerald-400', bg: 'bg-emerald-400/10', borderColor: 'border-emerald-400/20',
  },
  {
    icon: BookOpen, label: 'Ardent Guide', description: 'Ask your AI career mentor',
    href: '/guide', color: 'text-violet-400', bg: 'bg-violet-400/10', borderColor: 'border-violet-400/20',
  },
  {
    icon: FileText, label: 'ATS Resume', description: 'Build a professional resume',
    href: '/resume', color: 'text-rose-400', bg: 'bg-rose-400/10', borderColor: 'border-rose-400/20',
  },
];

export default function ClientHomePage({ initialGraphData }: { initialGraphData: any }) {
  const [graphData] = useState<{ nodes: any[]; edges: any[] }>(initialGraphData);
  const [skillGap, setSkillGap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState('free');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<ActiveMilestoneData | null>(null);
  const [milestoneLoading, setMilestoneLoading] = useState(true);

  // Derive dynamic stats from graph
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const currentRoleEdge = edges.find((e) => e.type === 'CURRENTLY_IN');
  const targetRoleEdge = edges.find((e) => e.type === 'TARGETS_ROLE');

  const currentRoleNode = nodes.find((n) => 
    (n.id === currentRoleEdge?.target || n.id === currentRoleEdge?.source) && 
    (n.type === 'role' || n.type === 'role_target')
  );
  
  const targetRoleNode = nodes.find((n) => 
    (n.id === targetRoleEdge?.target || n.id === targetRoleEdge?.source) && 
    (n.type === 'role' || n.type === 'role_target')
  );
  
  const currentRole = currentRoleNode?.label || 'Not Set';
  const targetRole = targetRoleNode?.label || 'Not Set';
  
  useEffect(() => {
    if (targetRole !== 'Not Set') {
      fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skill_gap', targetRole }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setSkillGap(json.data);
        })
        .catch(console.error);
    }
  }, [targetRole]);

  // Fetch active roadmap milestone for dashboard
  useEffect(() => {
    function getISTDateString(date: Date = new Date()) {
      const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
      const formatter = new Intl.DateTimeFormat('en-CA', options);
      return formatter.format(date);
    }

    async function fetchActiveRoadmap() {
      try {
        const res = await fetch('/api/roadmap');
        const json = await res.json();
        
        if (json.data?.tier) {
          setTier(json.data.tier);
        }

        if (json.data?.activeRoadmap) {
          const roadmap = json.data.activeRoadmap;
          const milestones = roadmap.milestones_data || [];
          
          // Find the most recently completed task across all milestones to check for skipped days
          let latestTaskDate: Date | null = null;
          for (const m of milestones) {
            if (m.tasks) {
              for (const t of m.tasks) {
                if (t.done && t.completedAt) {
                  const d = new Date(t.completedAt);
                  if (!latestTaskDate || d > latestTaskDate) latestTaskDate = d;
                }
              }
            }
          }

          if (latestTaskDate) {
            const todayStr = getISTDateString();
            const latestStr = getISTDateString(latestTaskDate);
            const todayTime = new Date(todayStr).getTime();
            const latestTime = new Date(latestStr).getTime();
            const diffDays = Math.floor((todayTime - latestTime) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
              setTimeout(() => {
                toast("You didn't complete your today's milestone. What's wrong, feeling sick already? 😉", {
                  icon: "👀",
                });
              }, 1500);
            }
          }

          // Find the current in-progress milestone, or the first non-completed one
          const currentMs = milestones.find((m: any) => m.status === 'in_progress')
            || milestones.find((m: any) => m.status !== 'completed')
            || milestones[0];

          if (currentMs) {
            setActiveMilestone({
              title: currentMs.title,
              description: currentMs.description,
              weekRange: currentMs.weekRange,
              tasks: currentMs.tasks || [],
              skills: currentMs.skills || [],
              roadmapTitle: roadmap.title,
              roadmapId: roadmap.id,
              milestoneId: currentMs.id,
              totalMilestones: milestones.length,
              completedMilestones: milestones.filter((m: any) => m.status === 'completed').length,
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch active roadmap:', e);
      } finally {
        setMilestoneLoading(false);
      }
    }
    fetchActiveRoadmap();
  }, []);

  // Handle task toggle from dashboard
  async function handleDashboardTaskToggle(taskIndex: number) {
    if (!activeMilestone) return;
    
    // Optimistic update
    setActiveMilestone(prev => {
      if (!prev) return prev;
      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], done: !newTasks[taskIndex].done };
      return { ...prev, tasks: newTasks };
    });

    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_task',
          roadmapId: activeMilestone.roadmapId,
          milestoneId: activeMilestone.milestoneId,
          taskIndex,
        }),
      });
      const json = await res.json();
      if (json.error) {
        // Revert optimistic update
        setActiveMilestone(prev => {
          if (!prev) return prev;
          const newTasks = [...prev.tasks];
          newTasks[taskIndex] = { ...newTasks[taskIndex], done: !newTasks[taskIndex].done };
          return { ...prev, tasks: newTasks };
        });
        toast.error(json.error);
      } else if (json.success) {
        const milestone = json.milestones?.find((m: any) => m.id === activeMilestone.milestoneId);
        if (milestone?.status === 'completed') {
          toast.success('🎯 All daily goals complete — milestone finished!');
        }
      }
    } catch (e) {
      console.error('Task toggle failed:', e);
      // Revert optimistic update
      setActiveMilestone(prev => {
        if (!prev) return prev;
        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], done: !newTasks[taskIndex].done };
        return { ...prev, tasks: newTasks };
      });
      toast.error('Network error.');
    }
  }

  const acquiredSkillsCount = nodes.filter((n) => n.type === 'skill').length;
  const targetSkillsCount = skillGap?.totalRequired || 15;
  const remainingSkillsCount = skillGap?.missingSkills?.length || Math.max(0, targetSkillsCount - acquiredSkillsCount);
  const readinessScore = skillGap?.readinessScore ?? (targetRole === 'Not Set' ? 0 : Math.min(100, Math.round((acquiredSkillsCount / targetSkillsCount) * 100)));

  const completedTasks = activeMilestone?.tasks.filter(t => t.done).length || 0;
  const totalTasks = activeMilestone?.tasks.length || 0;
  const milestoneProgress = activeMilestone ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-full">
      {/* ─── Top Header ─── */}
      <div className="border-b border-border/50 bg-card/20 backdrop-blur-sm px-6 py-5 md:px-10">
        <motion.div 
          className="mx-auto max-w-[1400px] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{getGreeting()} 👋</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s where you are on your career journey.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{getFormattedDate()}</span>
          </div>
        </motion.div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="px-6 py-8 md:px-10">
        <motion.div className="mx-auto max-w-[1400px]" variants={stagger} initial="initial" animate="animate">

          {/* ─── Stat Ribbon (4 columns) ─── */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Readiness */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Readiness</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedDigit value={readinessScore} /><span className="text-sm text-muted-foreground font-normal">%</span></p>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex items-center gap-4 t-resize">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills Mapped</p>
                <p className="text-2xl font-bold tabular-nums"><AnimatedDigit value={acquiredSkillsCount} /></p>
              </div>
            </div>

            {/* Daily Goals */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex items-center gap-4 t-resize">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10" style={{ position: 'relative' }}>
                <Map className="h-5 w-5 text-blue-400" />
                <span className="t-badge" data-open={completedTasks < totalTasks ? 'true' : 'false'}>
                  <span className="t-badge-dot h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] border-2 border-background"></span>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Goals</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold tabular-nums"><AnimatedDigit value={completedTasks} /><span className="text-sm text-muted-foreground font-normal"> / {totalTasks}</span></p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 flex items-center gap-4 t-resize">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                <Flame className="h-5 w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Milestones</p>
                <p className="text-2xl font-bold tabular-nums">
                  <AnimatedDigit value={activeMilestone ? activeMilestone.completedMilestones : 0} />
                  <span className="text-sm text-muted-foreground font-normal"> / {activeMilestone ? activeMilestone.totalMilestones : '-'}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Career Path + Readiness Gauge ─── */}
          <motion.div variants={fadeUp} className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
            {/* Career Path Card */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card/60 to-primary/[0.03] backdrop-blur-sm p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Route className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Active Career Path</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4 flex-1 flex-wrap">
                  <span className="rounded-lg bg-muted border border-border px-4 py-2.5 text-sm font-semibold">
                    {currentRole}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-primary/30 sm:w-12" />
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <div className="h-px w-8 bg-primary/30 sm:w-12" />
                  </div>
                  <span className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-4 py-2.5 text-sm font-semibold text-amber-400">
                    {targetRole}
                  </span>
                </div>
                <Link href="/paths" className="shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-lg">
                    View Paths <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Readiness Progress</span>
                  <span className="text-xs font-bold text-primary">{readinessScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" initial={{ width: 0 }} animate={{ width: `${readinessScore}%` }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }} />
                </div>
              </div>
            </div>

            {/* Readiness Gauge */}
            <div className="hidden lg:flex rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm items-center justify-center px-10 py-8">
              <ReadinessGauge score={readinessScore} size="lg" />
            </div>
          </motion.div>

          {/* ─── Middle Row: Milestone + Quick Actions ─── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            
            {/* Current Milestone */}
            <motion.div variants={fadeUp}>
              <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 md:p-8 h-full flex flex-col">
                {milestoneLoading ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                    <p className="text-sm text-muted-foreground">Loading milestone...</p>
                  </div>
                ) : activeMilestone ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                          <Map className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Current Milestone</h3>
                          <p className="text-[11px] text-muted-foreground">{activeMilestone.roadmapTitle}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-medium text-muted-foreground">{activeMilestone.weekRange}</span>
                    </div>

                    <h4 className="text-base font-bold">{activeMilestone.title}</h4>
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{activeMilestone.description}</p>

                    {/* Progress bar */}
                    <div className="mt-5 mb-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-muted-foreground">{completedTasks} of {totalTasks} tasks</span>
                        <span className="text-[11px] font-bold text-primary">{milestoneProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full bg-blue-400" initial={{ width: 0 }} animate={{ width: `${milestoneProgress}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </div>

                    <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto max-h-[220px]">
                      {activeMilestone.tasks.map((task, i) => (
                        <button
                          key={i}
                          onClick={() => handleDashboardTaskToggle(i)}
                          className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full text-left transition-all hover:bg-muted/50 ${task.done ? 'text-muted-foreground' : ''}`}
                        >
                          <div className="relative flex items-center justify-center h-4 w-4 shrink-0">
                            <span className="t-success-check absolute inset-0" data-state={task.done ? 'in' : 'out'} aria-hidden="true">
                              <svg viewBox="0 0 48 48" fill="none" className="h-4 w-4 text-emerald-400 stroke-current">
                                <path d="M14 24L20 30L34 16" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            {!task.done && <Circle className="absolute inset-0 h-4 w-4 text-muted-foreground/30 pointer-events-none" />}
                          </div>
                          <span className={task.done ? 'line-through opacity-70' : ''}>{task.title}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-border/50 flex justify-end gap-3">
                      {activeMilestone.totalMilestones === activeMilestone.completedMilestones && (
                        <Button 
                          onClick={() => setIsCertModalOpen(true)}
                          className="gap-1.5 rounded-lg text-xs bg-primary hover:bg-primary/90 text-white"
                        >
                          <Award className="h-3.5 w-3.5" /> Claim Certificate
                        </Button>
                      )}
                      <Link href="/roadmap">
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
                          Open Roadmap <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  /* No active roadmap */
                  <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                      <Map className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-base font-semibold">No active roadmap yet</h4>
                    <p className="mt-2 text-sm text-muted-foreground max-w-[260px]">
                      Chart your first learning path and watch your career milestones come alive.
                    </p>
                    <Link href="/roadmap" className="mt-5">
                      <Button className="h-11 px-6 rounded-full gap-2 text-[15px]">
                        <Sparkles className="h-4 w-4" />
                        Create Your Roadmap
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={fadeUp}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
                {quickActions.map((a) => (
                  <Link key={a.href} href={a.href}>
                    <div className={`group rounded-xl border ${a.borderColor} bg-card/40 backdrop-blur-sm p-5 h-full flex flex-col justify-between transition-all duration-200 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} transition-transform duration-200 group-hover:scale-110`}>
                        <a.icon className={`h-5 w-5 ${a.color}`} />
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold group-hover:text-foreground">{a.label}</h4>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{a.description}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        <span>Open</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
      {/* Certificate Modal */}
      {activeMilestone && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          roadmapId={activeMilestone.roadmapId}
          roadmapTitle={activeMilestone.roadmapTitle}
          tier={tier}
        />
      )}
    </div>
  );
}
