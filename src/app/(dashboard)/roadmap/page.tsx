'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Map,
  CheckCircle2,
  Circle,
  Lock,
  BookOpen,
  Code,
  Trophy,
  ChevronRight,
  Star,
  Sparkles,
  ArrowRight,
  Trash2,
  PowerOff,
  Bot,
  Search,
  Link as LinkIcon,
  FileText,
  Video,
  GraduationCap,
  X,
  Loader2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { getSearchResourceURLs } from '@/lib/tiers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { toast } from 'sonner';
import { CertificateModal } from '@/components/shared/certificate-modal';

interface DemoMilestone {
  id: string;
  title: string;
  description: string;
  weekRange: string;
  status: 'completed' | 'in_progress' | 'locked';
  skills: string[];
  tasks: { title: string; done: boolean; completedAt?: string }[];
  project: string;
}

interface SavedRoadmap {
  id: string;
  title: string;
  target_role: string;
  milestones_data: DemoMilestone[];
  total_milestones: number;
  is_active: boolean;
  created_at: string;
}

const statusIcons = {
  completed: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  in_progress: <Circle className="h-5 w-5 text-primary pulse-glow rounded-full" />,
  locked: <Lock className="h-5 w-5 text-muted-foreground/50" />,
};

export default function RoadmapPage() {
  const [activeMilestone, setActiveMilestone] = useState('');
  const [milestones, setMilestones] = useState<DemoMilestone[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Persisted roadmap state
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<SavedRoadmap | null>(null);
  const [currentRoadmapId, setCurrentRoadmapId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [togglingTask, setTogglingTask] = useState(false);

  // IST date string helper
  const getTodayIST = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

  // Read the date the user last clicked "Mark Today's Goal" from localStorage.
  // If it equals today's IST date, the button is hidden for the rest of the day.
  const [goalCompletedDateIST, setGoalCompletedDateIST] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ardent_goal_date_ist') ?? null;
  });

  const todayIST = getTodayIST();
  // Button is locked for today if the stored date matches today's IST date
  const goalDoneToday = goalCompletedDateIST === todayIST;

  // Tiers and Resources
  const [userTier, setUserTier] = useState('free');
  const [tierLimits, setTierLimits] = useState<any>(null);
  const [showResourcesFor, setShowResourcesFor] = useState<string | null>(null);
  const [milestoneResources, setMilestoneResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const getISTDateString = (date = new Date()) => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  };

  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const active = milestones.find((m) => m.id === activeMilestone);

  // Fetch saved roadmaps on mount
  const fetchRoadmaps = useCallback(async () => {
    try {
      const res = await fetch('/api/roadmap');
      const json = await res.json();
      if (json.data) {
        setSavedRoadmaps(json.data.roadmaps || []);
        const activeRM = json.data.activeRoadmap;
        if (activeRM) {
          setActiveRoadmap(activeRM);
          setCurrentRoadmapId(activeRM.id);
          setMilestones(activeRM.milestones_data || []);
          setActiveMilestone(activeRM.milestones_data?.[0]?.id || '');
          setHasGenerated(true);
          setTargetRole(activeRM.target_role || '');
        }
        if (json.data.tier) {
          setUserTier(json.data.tier);
          setTierLimits(json.data.limits);
        }
      }
    } catch (e) {
      console.error('Failed to fetch roadmaps:', e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  async function generateRoadmap() {
    if (!targetRole) return;

    // Frontend tier enforcement
    if (tierLimits) {
      if (savedRoadmaps.length >= tierLimits.maxRoadmaps) {
        toast.error(`You've reached the maximum of ${tierLimits.maxRoadmaps} roadmaps for your ${userTier} plan. Upgrade to save more.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    const toastId = toast.loading(`Generating roadmap for ${targetRole}...`, { description: 'This may take 15-30 seconds.' });
    
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setMilestones(json.data);
        setActiveMilestone(json.data[0].id);
        setHasGenerated(true);
        
        // If we got a saved roadmap back, update our state
        if (json.roadmap) {
          setCurrentRoadmapId(json.roadmap.id);
          setSavedRoadmaps(prev => [json.roadmap, ...prev]);
        }
        
        toast.success('Roadmap generated successfully!', { id: toastId });
      } else if (json.error) {
        setError(json.error);
        toast.error(json.error, { id: toastId });
      } else {
        setError('No milestones were generated. Please try again.');
        toast.error('No milestones generated', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(roadmapId: string) {
    const toastId = toast.loading('Setting as active roadmap...');
    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active', roadmapId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRoadmaps();
        toast.success('Roadmap activated! Dashboard will now reflect this roadmap.', { id: toastId });
      } else {
        toast.error(json.error || 'Failed to activate roadmap', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error.', { id: toastId });
    }
  }

  async function handleDeactivate(roadmapId: string) {
    const toastId = toast.loading('Deactivating roadmap...');
    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', roadmapId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRoadmaps();
        toast.success('Roadmap deactivated.', { id: toastId });
      } else {
        toast.error(json.error || 'Failed to deactivate', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error.', { id: toastId });
    }
  }

  async function handleDelete(roadmapId: string) {
    if (!confirm('Are you sure you want to delete this roadmap? This cannot be undone.')) return;
    const toastId = toast.loading('Deleting roadmap...');
    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', roadmapId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRoadmaps();
        toast.success('Roadmap deleted successfully.', { id: toastId });
      } else {
        toast.error(json.error || 'Failed to delete roadmap', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error.', { id: toastId });
    }
  }

  async function handleMarkMilestoneComplete(milestoneId: string) {
    if (!currentRoadmapId) return;
    setMarkingComplete(true);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_milestone_complete', roadmapId: currentRoadmapId, milestoneId }),
      });
      const json = await res.json();
      if (json.success && json.milestones) {
        setMilestones(json.milestones);
        toast.success('🏆 Milestone completed! Great progress!');
        const milestone = milestones.find(m => m.id === milestoneId);
        if (milestone) {
          try {
            await fetch('/api/graph', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sync_skills',
                skills: milestone.skills.map(s => ({ name: s, proficiency: 'intermediate', category: 'learning' })),
              }),
            });
          } catch (e) { console.error('Skill sync failed:', e); }
        }
      } else {
        toast.error(json.error || 'Failed to complete milestone');
      }
    } catch (e) {
      toast.error('Network error.');
    } finally {
      setMarkingComplete(false);
    }
  }

  async function handleViewResources(milestone: any) {
    const access = tierLimits?.resourceAccess || 'search';
    
    // Find the current active daily task
    const nextTask = milestone.tasks?.find((t: any) => !t.done);
    const contextTitle = nextTask ? `${milestone.title}: ${nextTask.title}` : milestone.title;

    if (access === 'search') {
      // Free tier: direct open
      const urls = getSearchResourceURLs(milestone.skills || [], contextTitle);
      window.open(urls.youtube, '_blank');
      window.open(urls.google, '_blank');
      toast.success('Opened search queries in new tabs.');
      return;
    }

    if (access === 'panel') {
      // Pro tier: open panel with predefined search links
      setShowResourcesFor(milestone.id);
      const urls = getSearchResourceURLs(milestone.skills || [], contextTitle);
      setMilestoneResources([
        { title: `Search YouTube: ${nextTask?.title || 'Tutorials'}`, url: urls.youtube, type: 'video' },
        { title: `Search Google: ${nextTask?.title || 'Resources'}`, url: urls.google, type: 'doc' },
      ]);
      return;
    }

    if (access === 'ai') {
      // Max tier: open panel and fetch from AI + db
      setShowResourcesFor(milestone.id);
      setLoadingResources(true);
      setMilestoneResources([]);
      try {
        const res = await fetch('/api/roadmap/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestoneTitle: contextTitle, skills: milestone.skills || [] })
        });
        const json = await res.json();
        if (json.success) {
          setMilestoneResources(json.resources);
        } else {
          toast.error(json.error || 'Failed to fetch AI resources');
        }
      } catch (e) {
        toast.error('Network error while fetching resources');
      } finally {
        setLoadingResources(false);
      }
    }
  }

  async function handleTaskToggle(milestoneId: string, taskIndex: number) {
    // Hard gate: if togglingTask is true OR 24-hr cooldown is active, do nothing
    if (togglingTask || is24HrCooldownActive) return;
    
    if (!currentRoadmapId) {
      // Fallback: local only toggle
      setMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          const newTasks = [...m.tasks];
          newTasks[taskIndex].done = !newTasks[taskIndex].done;
          const allDone = newTasks.every(t => t.done);
          return { ...m, tasks: newTasks, status: allDone ? 'completed' : m.status };
        }
        return m;
      }));
      return;
    }

    // Write timestamp to localStorage IMMEDIATELY before any async work.
    // This is the critical gate — even if the user opens two tabs or spams clicks,
    // the timestamp is committed to storage before the first request completes.
    const clickTimestamp = Date.now();
    localStorage.setItem('ardent_last_task_click', String(clickTimestamp));
    setLastTaskClickedAt(clickTimestamp);

    // Lock the button
    setTogglingTask(true);
    setMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const newTasks = [...m.tasks];
        newTasks[taskIndex].done = !newTasks[taskIndex].done;
        return { ...m, tasks: newTasks };
      }
      return m;
    }));

    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_task', roadmapId: currentRoadmapId, milestoneId, taskIndex }),
      });
      const json = await res.json();
      if (json.success && json.milestones) {
        setMilestones(json.milestones);

        // Check if all tasks just completed
        const milestone = json.milestones.find((m: any) => m.id === milestoneId);
        if (milestone?.status === 'completed') {
          toast.success('🎯 All daily goals complete — milestone finished!');
        }
      } else if (json.error) {
        // Revert optimistic update
        setMilestones(prev => prev.map(m => {
          if (m.id === milestoneId) {
            const newTasks = [...m.tasks];
            newTasks[taskIndex].done = !newTasks[taskIndex].done;
            return { ...m, tasks: newTasks };
          }
          return m;
        }));
        toast.error(json.error);
      }
    } catch (e) {
      console.error('Task toggle failed:', e);
      // Revert optimistic update on crash
      setMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          const newTasks = [...m.tasks];
          newTasks[taskIndex].done = !newTasks[taskIndex].done;
          return { ...m, tasks: newTasks };
        }
        return m;
      }));
      toast.error('Network error.');
    } finally {
      setTogglingTask(false);
    }
  }

  /**
   * Dedicated handler for the "Mark Today's Goal as Completed" button.
   * Commits the IST date to localStorage SYNCHRONOUSLY before any async work,
   * so no amount of rapid clicking can fire a second request today.
   */
  async function handleCompleteGoal(milestoneId: string) {
    if (togglingTask || goalDoneToday || !currentRoadmapId) return;

    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    const taskIndex = milestone.tasks.findIndex(t => !t.done);
    if (taskIndex === -1) return;

    // ── Commit IST date IMMEDIATELY — this hides the button on re-render ──
    const dateStr = getTodayIST();
    localStorage.setItem('ardent_goal_date_ist', dateStr);
    setGoalCompletedDateIST(dateStr); // button disappears on next render
    setTogglingTask(true);

    // Optimistic UI update
    setMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const newTasks = [...m.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], done: true };
        return { ...m, tasks: newTasks };
      }
      return m;
    }));

    try {
      const res = await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_task', roadmapId: currentRoadmapId, milestoneId, taskIndex }),
      });
      const json = await res.json();
      if (json.success && json.milestones) {
        setMilestones(json.milestones);
        const updated = json.milestones.find((m: any) => m.id === milestoneId);
        if (updated?.status === 'completed') {
          toast.success('🎯 All daily goals complete — milestone finished!');
        } else {
          toast.success('✅ Goal marked! Come back tomorrow for the next one.');
        }
      } else if (json.error) {
        // Revert optimistic update and unlock the button
        setMilestones(prev => prev.map(m => {
          if (m.id === milestoneId) {
            const newTasks = [...m.tasks];
            newTasks[taskIndex] = { ...newTasks[taskIndex], done: false };
            return { ...m, tasks: newTasks };
          }
          return m;
        }));
        localStorage.removeItem('ardent_goal_date_ist');
        setGoalCompletedDateIST(null);
        toast.error(json.error);
      }
    } catch (e) {
      setMilestones(prev => prev.map(m => {
        if (m.id === milestoneId) {
          const newTasks = [...m.tasks];
          newTasks[taskIndex] = { ...newTasks[taskIndex], done: false };
          return { ...m, tasks: newTasks };
        }
        return m;
      }));
      localStorage.removeItem('ardent_goal_date_ist');
      setGoalCompletedDateIST(null);
      toast.error('Network error. Please try again.');
    } finally {
      setTogglingTask(false);
    }
  }

  function handleViewRoadmap(roadmap: SavedRoadmap) {
    setMilestones(roadmap.milestones_data || []);
    setActiveMilestone(roadmap.milestones_data?.[0]?.id || '');
    setHasGenerated(true);
    setCurrentRoadmapId(roadmap.id);
    setTargetRole(roadmap.target_role || '');
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <motion.div
        className="mx-auto max-w-5xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Active Roadmap Banner */}
        {activeRoadmap && (
          <motion.div
            variants={staggerItem}
            className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary uppercase tracking-wider">Active Roadmap</p>
                  <p className="text-sm font-semibold">{activeRoadmap.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {activeRoadmap.milestones_data?.filter((m: any) => m.status === 'completed').length || 0}/{activeRoadmap.total_milestones} milestones
                </span>
                {currentRoadmapId !== activeRoadmap.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewRoadmap(activeRoadmap)}
                    className="text-xs"
                  >
                    View Active
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adaptive Roadmap</h1>
            <p className="mt-1 text-muted-foreground">
              Your personalized, AI-generated path to your target role.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="flex h-11 w-full sm:w-56 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors hover:border-primary/30"
              placeholder="Target Role"
            />
            <Button onClick={generateRoadmap} disabled={loading} className="shrink-0 h-11 px-6 rounded-xl text-[15px]">
              {loading ? 'Generating...' : 'Generate Roadmap'}
            </Button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            variants={staggerItem}
            className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-5"
          >
            <p className="text-sm text-red-400">⚠️ {error}</p>
            <button 
              onClick={generateRoadmap}
              className="mt-2 text-xs text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Saved Roadmaps Picker */}
        {savedRoadmaps.length > 0 && (
          <motion.div variants={staggerItem} className="mt-6">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Your Roadmaps</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {savedRoadmaps.map((rm) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={rm.id}
                  onClick={() => handleViewRoadmap(rm)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleViewRoadmap(rm);
                    }
                  }}
                  className={`shrink-0 cursor-pointer rounded-xl border p-4 text-left transition-all min-w-[200px] ${
                    currentRoadmapId === rm.id
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-primary/20 hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{rm.target_role}</p>
                    {rm.is_active && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] ml-2">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rm.milestones_data?.filter((m: any) => m.status === 'completed').length || 0}/{rm.total_milestones} done
                  </p>
                  <div className="mt-3 flex gap-2">
                    {rm.is_active ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); handleDeactivate(rm.id); }}
                        className="text-[10px] h-7 px-3 gap-1 w-full border border-border"
                      >
                        <PowerOff className="h-3 w-3" /> Deactivate
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => { e.stopPropagation(); handleSetActive(rm.id); }}
                          className="text-[10px] h-7 px-3 gap-1 flex-1"
                        >
                          <Star className="h-3 w-3" /> Set Active
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleDelete(rm.id); }}
                          className="h-7 w-7 shrink-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-400/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Roadmap State */}
        {!hasGenerated && !loading && savedRoadmaps.length === 0 && (
          <motion.div
            variants={staggerItem}
            className="mt-12 rounded-2xl border border-dashed border-border/50 bg-card/30 p-16 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
              <Map className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Your journey starts here</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              No roadmap selected yet. Enter your dream role above and hit <strong>Generate Roadmap</strong> to get an AI-powered learning plan tailored just for you.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI skill gap analysis</span>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        {hasGenerated && milestones.length > 0 && (
          <motion.div
            variants={staggerItem}
            className="mt-6 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {completedCount}/{totalCount} milestones
                </span>
                {currentRoadmapId && !activeRoadmap?.id?.includes(currentRoadmapId) && (
                  <Button
                    size="sm"
                    onClick={() => currentRoadmapId && handleSetActive(currentRoadmapId)}
                    className="text-xs gap-1 h-7"
                  >
                    <Star className="h-3 w-3" /> Set as Active
                  </Button>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="mt-3 h-2" />
          </motion.div>
        )}

        {/* Main Layout: Timeline + Detail */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Timeline */}
          <motion.div variants={staggerItem} className="space-y-0">
            {loading && (
              <div className="py-12 text-center border rounded-xl bg-card/30">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                <p className="text-sm text-muted-foreground">AI is calculating your skill gaps and planning milestones...</p>
              </div>
            )}
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex gap-3">
                {/* Timeline line */}
                {index < milestones.length - 1 && (
                  <div
                    className={`absolute left-[9px] top-8 h-[calc(100%)] w-px ${
                      milestone.status === 'completed'
                        ? 'bg-emerald-400/50'
                        : milestone.status === 'in_progress'
                        ? 'bg-primary/30 border-dashed'
                        : 'bg-muted-foreground/15'
                    }`}
                  />
                )}

                {/* Status icon */}
                <div className="relative z-10 mt-1 shrink-0">
                  {statusIcons[milestone.status as keyof typeof statusIcons] || statusIcons.locked}
                </div>

                {/* Milestone button */}
                <button
                  className={`mb-4 flex-1 rounded-lg border p-3 text-left transition-all ${
                    activeMilestone === milestone.id
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-transparent hover:bg-muted/30'
                  } ${milestone.status === 'locked' ? 'opacity-50' : ''}`}
                  onClick={() => setActiveMilestone(milestone.id)}
                >
                  <p className="text-xs text-muted-foreground">{milestone.weekRange}</p>
                  <p className="mt-0.5 text-sm font-semibold">{milestone.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {milestone.skills?.slice(0, 2).map((s) => (
                      <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">
                        {s}
                      </Badge>
                    ))}
                    {milestone.skills && milestone.skills.length > 2 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{milestone.skills.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            ))}
            
            {/* Certificate Node */}
            {milestones.length > 0 && (
              <div className="relative flex gap-3 mt-2">
                {/* Timeline line connecting from the last milestone */}
                <div
                  className={`absolute left-[9px] -top-6 h-8 w-px ${
                    completedCount === totalCount
                      ? 'bg-emerald-400/50'
                      : 'bg-muted-foreground/15'
                  }`}
                />
                
                {/* Status icon */}
                <div className="relative z-10 mt-1 shrink-0">
                  {completedCount === totalCount ? (
                    <Award className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>

                {/* Milestone button */}
                <button
                  className={`mb-4 flex-1 rounded-lg border p-3 text-left transition-all ${
                    completedCount === totalCount
                      ? 'border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10'
                      : 'border-transparent hover:bg-muted/30 opacity-70'
                  }`}
                  onClick={() => setIsCertModalOpen(true)}
                >
                  <p className="text-xs text-muted-foreground">Final Step</p>
                  <p className="mt-0.5 text-sm font-semibold flex items-center gap-2">
                    Official Certificate
                    {completedCount === totalCount ? (
                      <Badge className="bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/20 text-[9px] ml-auto border-emerald-400/20">Available</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] ml-auto border-border">Preview</Badge>
                    )}
                  </p>
                </button>
              </div>
            )}
          </motion.div>

          {/* Detail Panel */}
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[10px]">
                    {active.weekRange}
                  </Badge>
                  <h2 className="mt-2 text-xl font-bold">{active.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active.description}
                  </p>
                </div>
                {active.status === 'completed' && (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Complete
                  </div>
                )}
              </div>

              {/* Skills Covered */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Skills Covered</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.skills.map((skill) => (
                    <Badge key={skill} className="bg-primary/10 text-primary text-[10px] border-primary/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Daily Tasks */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Daily Goals ({active.tasks.filter((t) => t.done).length}/{active.tasks.length})
                  </p>
                  {active.tasks.filter(t => t.done).length === active.tasks.length && active.status !== 'completed' && (
                    <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> All goals conquered!
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {active.tasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => handleTaskToggle(active.id, i)}
                      disabled={active.status === 'locked'}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-all hover:bg-muted/40 ${
                        task.done ? 'bg-emerald-400/5' : 'bg-muted/20'
                      } ${active.status === 'locked' ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span
                        className={task.done ? 'text-muted-foreground line-through' : ''}
                      >
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project */}
              <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Code className="h-3.5 w-3.5" />
                  Milestone Project
                </div>
                <p className="mt-1 text-sm font-semibold">{active.project}</p>
              </div>

              {/* Actions */}
              {active.status !== 'locked' && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {active.status === 'in_progress' && (
                    <>
                      {/* Show "Mark Today's Goal" ONLY when tasks remain AND goal not done today */}
                      {active.tasks.some(t => !t.done) && !goalDoneToday && (
                        <Button
                          className="gap-1.5 h-10 px-5"
                          disabled={togglingTask}
                          onClick={() => handleCompleteGoal(active.id)}
                        >
                          {togglingTask ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          )}
                          {togglingTask ? 'Saving...' : "Mark Today's Goal as Completed"}
                        </Button>
                      )}
                      {/* Show "Mark Milestone Complete" only when ALL tasks are done */}
                      {!active.tasks.some(t => !t.done) && (
                        <Button
                          className="gap-1.5 h-10 px-5"
                          disabled={markingComplete}
                          onClick={() => handleMarkMilestoneComplete(active.id)}
                        >
                          {markingComplete ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trophy className="h-4 w-4" />
                          )}
                          Mark Milestone Complete
                        </Button>
                      )}
                    </>
                  )}
                  <Button variant="outline" className="gap-1.5 h-10 px-5" onClick={() => handleViewResources(active)}>
                    <BookOpen className="h-4 w-4" />
                    View Resources
                  </Button>
                </div>
              )}

              {/* Resource Panel */}
              <AnimatePresence>
                {showResourcesFor === active.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 relative">
                      <button 
                        onClick={() => setShowResourcesFor(null)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">
                          {userTier === 'max' ? 'AI Curated Resources' : 'Learning Resources'}
                        </h3>
                        <Badge variant="outline" className="text-[10px] ml-2 border-primary/30 text-primary uppercase">
                          {userTier} Tier
                        </Badge>
                      </div>

                      {loadingResources ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Curating the best resources for you...</p>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {milestoneResources.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                            >
                              <div className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                {res.type === 'video' ? <Video className="h-4 w-4" /> :
                                 res.type === 'doc' ? <FileText className="h-4 w-4" /> :
                                 res.type === 'course' ? <GraduationCap className="h-4 w-4" /> :
                                 <LinkIcon className="h-4 w-4" />}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">{res.title}</span>
                                <span className="truncate text-[10px] text-muted-foreground mt-0.5">{new URL(res.url).hostname}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {userTier === 'pro' && (
                        <div className="mt-5 rounded-lg bg-card/60 border border-dashed border-border p-4 text-center">
                          <p className="text-xs text-muted-foreground mb-2">Want highly specific, AI-curated links instead of searches?</p>
                          <Link href="/plans">
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              <Star className="h-3 w-3 mr-1" /> Upgrade to Max
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        roadmapId={currentRoadmapId || 'mock-123'}
        roadmapTitle={activeRoadmap?.title || targetRole || 'Software Engineer Roadmap'}
        tier={userTier}
      />
    </div>
  );
}
