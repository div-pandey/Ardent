'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldAlert, ArrowRight, Loader2, Cpu, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TIER_CONFIG, TierName } from '@/lib/tiers';

const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export default function ScenariosPage() {
  const [role, setRole] = useState('');
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputAction, setInputAction] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [systemHealth, setSystemHealth] = useState(100);
  const [turnInfo, setTurnInfo] = useState<{ current: number; total: number } | null>(null);
  const [usageStats, setUsageStats] = useState<{ remaining: number; total: number; isUnlimited: boolean } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    async function fetchUsage() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
      const tierName = (profile?.subscription_tier as TierName) || 'free';
      const tierLimits = TIER_CONFIG[tierName];

      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
      const monthStartUTC = new Date(monthStart.getTime() - istOffset);

      const { count: monthlyScenarios } = await supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartUTC.toISOString());

      const used = monthlyScenarios ?? 0;
      const total = tierLimits.scenariosPerMonth;
      
      setUsageStats({
        remaining: Math.max(0, total - used),
        total,
        isUnlimited: total >= 9999
      });
    }
    fetchUsage();
  }, []);

  const handleStart = async () => {
    if (!role.trim()) {
      toast.error('Please enter a target role');
      return;
    }
    setLoading(true);
    setSystemHealth(100);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();

      if (res.status === 403) {
        toast.error(json.error || 'Limit reached');
        router.push('/plans');
        return;
      }

      if (json.success) {
        setScenarioId(json.scenarioId);
        setMessages([{ role: 'assistant', content: json.initialMessage }]);
      } else {
        toast.error(json.error || 'Failed to start simulation');
      }
    } catch (e) {
      toast.error('Network error starting simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAction = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputAction.trim() || !scenarioId) return;

    const actionText = inputAction;
    setInputAction('');
    setMessages(prev => [...prev, { role: 'user', content: actionText }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, message: actionText }),
      });
      const json = await res.json();

      if (json.success) {
        let aiMsg = (json.message as string)
          .replace('[SIMULATION_COMPLETE]', '')
          .trim();

        setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);
        setSystemHealth(prev => Math.max(10, Math.min(100, prev + (Math.random() > 0.5 ? 5 : -15))));

        // Update turn info for the progress indicator
        if (json.turnInfo) {
          setTurnInfo(json.turnInfo);
        }

        // Auto-finish: trust the API flag, not the AI text
        if (json.simulationComplete) {
          toast.info('Shift over! Compiling your performance report...', { duration: 4000 });
          setTimeout(() => {
            handleFinish();
          }, 3000);
        }
      } else {
        toast.error(json.error || 'Failed to execute action');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setIsTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputAction(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAction();
    }
  };

  const handleFinish = async () => {
    if (!scenarioId) return;
    setLoading(true);
    const toastId = toast.loading('Compiling simulation report...');
    try {
      const res = await fetch('/api/scenarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, action: 'finish' }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Simulation concluded!', { id: toastId });
        setFeedback(json.scenario.feedback);
        setSystemHealth(json.scenario.feedback.score); // Sync health to final score
      } else {
        toast.error(json.error || 'Failed to end simulation', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error finishing simulation', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen px-6 py-8 md:px-10 md:py-12 lg:px-16 flex flex-col overflow-hidden bg-background">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div className="mx-auto max-w-5xl w-full relative z-10 flex-1 flex flex-col min-h-0" variants={stagger} initial="initial" animate="animate">
        
        {/* Header / HUD */}
        {(scenarioId || feedback) && (
           <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">SIM_ENV // {role.toUpperCase() || 'UNKNOWN'}</h1>
            </div>
            <div className="flex items-center gap-4">
              {turnInfo && !feedback && (
                <span className="text-xs font-bold tracking-widest text-muted-foreground">
                  TURN <span className="text-foreground">{turnInfo.current}</span>/{turnInfo.total}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground tracking-widest">SYS_HEALTH</span>
                <div className="w-24">
                  <Progress value={systemHealth} className="h-2 bg-muted [&>div]:bg-primary" />
                </div>
                <span className="text-xs font-bold text-primary">{systemHealth}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start Screen */}
        {!scenarioId && !feedback && (
          <motion.div variants={fadeUp} className="flex-1 flex flex-col items-center justify-center -mt-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-8 glow-accent">
              <ShieldAlert className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-center">Day in the Life</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-center text-lg">
              You will be placed into a simulated production environment. Your technical decisions will impact system health. Proceed with caution.
            </p>
            
            <div className="flex flex-col w-full max-w-xl gap-4 mx-auto mb-10">
              <Input 
                placeholder="Target Role (e.g. Senior DevOps)" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-14 bg-card/50 text-lg px-6 rounded-2xl border-primary/20 focus-visible:ring-primary/50"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
              <Button size="lg" disabled={loading || (usageStats && !usageStats.isUnlimited && usageStats.remaining <= 0)} className="rounded-2xl w-full h-14 text-lg font-semibold" onClick={handleStart}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Simulation'}
              </Button>
            </div>
            
            {usageStats && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {usageStats.isUnlimited ? (
                    <span className="text-emerald-500">Unlimited scenarios available on Max plan</span>
                  ) : (
                    <span>
                      <span className={`font-bold ${usageStats.remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{usageStats.remaining}</span> out of {usageStats.total} scenarios remaining this month
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Active Scenario Terminal */}
        {scenarioId && !feedback && (
          <motion.div variants={fadeUp} className="flex-1 flex flex-col relative mt-4 min-h-0">
            
            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto pb-32 space-y-8 text-sm leading-relaxed text-foreground font-mono">
              <div className="text-muted-foreground mb-6">
                <p>Loading environment modules...</p>
                <p>Connecting to production database [OK]</p>
                <p>Simulation active. Date: {new Date().toISOString().split('T')[0]}</p>
                <hr className="border-border/50 my-4" />
              </div>

              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4"
                >
                  {msg.role === 'user' ? (
                    <div className="text-primary font-bold">
                      <span className="text-muted-foreground font-normal mr-2">root@sim:~$</span>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-foreground pl-4 border-l-2 border-primary/30 py-1 bg-primary/5 rounded-r-lg">
                      <span className="text-primary font-bold mr-2">[SYS]</span>
                      <span className="whitespace-pre-wrap font-sans">{msg.content}</span>
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 animate-pulse text-primary" /> Processing action...
                </div>
              )}
              <div ref={terminalEndRef} className="h-8" />
            </div>

            {/* Action Input */}
            <div className="absolute bottom-0 left-0 right-0 pt-20 pb-4 px-4 bg-gradient-to-t from-teal-50 via-teal-50/95 via-40% to-transparent dark:from-[#020617] dark:via-[#020617]/95 flex flex-col gap-3 pointer-events-none">
              <div className="flex justify-center pointer-events-auto">
                 <Button type="button" variant="outline" size="sm" onClick={handleFinish} disabled={loading || isTyping} className="h-7 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 shadow-sm">
                  Abort Simulation
                </Button>
              </div>
              <form onSubmit={handleSendAction} className="relative flex items-end gap-3 w-full pointer-events-auto">
                <div className="flex-1 relative bg-white/70 dark:bg-[#0f172a] border border-primary/15 hover:border-primary/30 rounded-2xl p-2 pl-4 flex items-end gap-3 shadow-lg shadow-teal-500/5 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/50 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
                    <Terminal className="h-5 w-5 text-primary" />
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={inputAction}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Execute command or make a decision..."
                    className="flex-1 bg-transparent border-none text-foreground font-mono shadow-none focus-visible:ring-0 text-sm resize-none outline-none max-h-[150px] py-3 placeholder:text-muted-foreground"
                    disabled={isTyping || loading}
                    rows={1}
                  />
                  <Button 
                    type="submit" 
                    disabled={!inputAction.trim() || loading || isTyping} 
                    className="shrink-0 h-10 w-10 p-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-50 mb-0.5"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Feedback / Debrief Screen */}
        {feedback && (
          <motion.div variants={fadeUp} className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="border border-border/50 bg-card rounded-3xl p-8 md:p-12 w-full shadow-2xl relative overflow-hidden text-left">
              
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Simulation Report</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="col-span-1 p-8 rounded-2xl bg-muted/50 border border-border/50 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl font-black mb-3 flex items-baseline gap-1">
                    <span className={feedback.score >= 80 ? 'text-emerald-500' : feedback.score >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                      {feedback.score}
                    </span>
                    <span className="text-2xl text-muted-foreground font-medium">/100</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Performance Rating</span>
                </div>
                
                <div className="col-span-1 md:col-span-2 p-8 rounded-2xl bg-muted/30 border border-border/50 text-sm text-foreground leading-relaxed overflow-y-auto max-h-64 whitespace-pre-wrap">
                  {feedback.feedback}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  className="rounded-xl px-8 font-bold"
                  size="lg"
                  onClick={() => {
                    setFeedback(null);
                    setScenarioId(null);
                    setMessages([]);
                    setRole('');
                    setTurnInfo(null);
                  }}
                >
                  Restart System
                </Button>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
