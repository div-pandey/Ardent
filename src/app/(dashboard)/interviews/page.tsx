'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Bot, User, CheckCircle2, AlertCircle, Loader2, BarChart3, ChevronRight, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/ui/tilt-card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TIER_CONFIG, TierName } from '@/lib/tiers';

const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export default function MockInterviewsPage() {
  const [topic, setTopic] = useState('');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [usageStats, setUsageStats] = useState<{ remaining: number; total: number; isUnlimited: boolean } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      const { count: monthlyInterviews } = await supabase
        .from('mock_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartUTC.toISOString());

      const used = monthlyInterviews ?? 0;
      const total = tierLimits.interviewsPerMonth;
      
      setUsageStats({
        remaining: Math.max(0, total - used),
        total,
        isUnlimited: total >= 9999
      });
    }
    fetchUsage();
  }, []);

  const handleStart = async () => {
    if (!topic.trim()) {
      toast.error('Please enter an interview topic');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const json = await res.json();

      if (res.status === 403) {
        toast.error(json.error || 'Limit reached');
        router.push('/plans');
        return;
      }

      if (json.success) {
        setInterviewId(json.interviewId);
        setMessages([{ role: 'assistant', content: json.initialMessage }]);
      } else {
        toast.error(json.error || 'Failed to start interview');
      }
    } catch (e) {
      toast.error('Network error starting interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !interviewId) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/interviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, message: userMsg }),
      });
      const json = await res.json();

      if (json.success) {
        let aiMsg = json.message as string;
        const isComplete = aiMsg.includes('[INTERVIEW_COMPLETE]');
        if (isComplete) {
          aiMsg = aiMsg.replace('[INTERVIEW_COMPLETE]', '').trim();
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

        if (isComplete) {
          toast.info('Interview complete! Generating your performance report...', { duration: 4000 });
          setTimeout(() => {
            handleFinish();
          }, 3000);
        }
      } else {
        toast.error(json.error || 'Failed to send message');
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
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFinish = async () => {
    if (!interviewId) return;
    setLoading(true);
    const toastId = toast.loading('Analyzing interview performance...');
    try {
      const res = await fetch('/api/interviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, action: 'finish' }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Interview completed!', { id: toastId });
        setFeedback(json.interview.feedback);
      } else {
        toast.error(json.error || 'Failed to end interview', { id: toastId });
      }
    } catch (e) {
      toast.error('Network error finishing interview', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-12 md:px-10 lg:px-16 min-h-[calc(100vh-4rem)] flex flex-col">
      <motion.div className="mx-auto w-full max-w-4xl flex-1 flex flex-col" variants={stagger} initial="initial" animate="animate">
        
        {/* Header */}
        {!interviewId && !feedback && (
          <motion.div variants={fadeUp} className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-400/10 border border-blue-400/20">
                <Mic className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mock Interviews</h1>
            </div>
            <p className="text-base text-muted-foreground mt-2">
              Practice live technical interviews tailored to your target role.
            </p>
          </motion.div>
        )}

        {/* Start Screen */}
        {!interviewId && !feedback && (
          <motion.div variants={fadeUp} className="flex-1 flex flex-col items-center justify-center -mt-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-8 glow-accent">
              <Mic className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-center">AI Technical Interview</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-center text-lg">
              The AI acts as a hiring manager. Enter a topic or role (e.g., "React Senior Developer", "System Design") to begin.
            </p>
            
            <div className="flex flex-col w-full max-w-xl gap-4 mx-auto mb-10">
              <Input 
                placeholder="e.g. Node.js Backend Engineer" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-14 bg-card/50 text-lg px-6 rounded-2xl border-primary/20 focus-visible:ring-primary/50"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
              <Button size="lg" className="rounded-2xl w-full h-14 text-lg font-semibold" onClick={handleStart} disabled={loading || (usageStats && !usageStats.isUnlimited && usageStats.remaining <= 0)}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Interview'}
              </Button>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {usageStats && (
                <div className="flex items-center gap-2 text-sm font-medium">
                   <BarChart3 className="h-4 w-4 text-primary" />
                   {usageStats.isUnlimited ? (
                     <span className="text-emerald-400">Unlimited interviews available on Max plan</span>
                   ) : (
                     <span>
                       <span className={`font-bold ${usageStats.remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{usageStats.remaining}</span> out of {usageStats.total} interviews remaining this month
                     </span>
                   )}
                </div>
              )}
              <Badge variant="outline" className="px-4 py-2 text-xs font-normal border-primary/20 text-primary/80">
                <AlertCircle className="h-3.5 w-3.5 mr-2" /> Powered by Sarvam AI Model
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Active Interview Screen */}
        {interviewId && !feedback && (
          <motion.div variants={fadeUp} className="flex flex-col flex-1 relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border/50 bg-card/95 backdrop-blur-md flex justify-between items-center z-20 sticky top-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
                  <div className="bg-primary/20 rounded-full relative z-10 border border-primary/30 overflow-hidden h-10 w-10">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150" alt="Priya" className="object-cover h-full w-full" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Priya (Senior Tech Lead)</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interviewing for: {topic}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleFinish} disabled={loading || isTyping} className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                End Interview
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background/30 to-background/5">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150" alt="Priya" className="object-cover h-full w-full" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 border border-primary/20 text-foreground' 
                      : 'bg-card border border-border text-foreground/90'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150" alt="Priya" className="object-cover h-full w-full" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="flex-1 bg-card border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 text-base rounded-xl p-3 resize-none outline-none min-h-[48px] max-h-[200px]"
                  disabled={isTyping || loading}
                  rows={1}
                />
                <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-xl bg-primary hover:bg-primary/90" disabled={!inputMessage.trim() || isTyping || loading}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Feedback Screen */}
        {feedback && (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-8">
            <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden">
              
              {/* Decorative background glow based on score */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-3xl opacity-20 pointer-events-none ${
                feedback.score >= 80 ? 'bg-emerald-500' : feedback.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`} />

              <div className="text-center mb-10 relative z-10">
                <h2 className="text-3xl font-bold mb-2">Interview Complete</h2>
                <p className="text-muted-foreground">Topic: {topic}</p>
                
                <div className="mt-8 flex justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted opacity-30" />
                      <circle 
                        cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={377} strokeDashoffset={377 - (377 * feedback.score) / 100}
                        className={`transition-all duration-1000 ease-out ${
                          feedback.score >= 80 ? 'text-emerald-500' : feedback.score >= 50 ? 'text-amber-500' : 'text-rose-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{feedback.score}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background/50 border border-border/50 rounded-2xl p-6 relative z-10 prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" /> AI Evaluation
                </h3>
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {feedback.feedback}
                </div>
              </div>

              <div className="mt-8 flex justify-center z-10 relative">
                <Button 
                  size="lg" 
                  className="rounded-xl px-8" 
                  onClick={() => {
                    setFeedback(null);
                    setInterviewId(null);
                    setTopic('');
                    setMessages([]);
                  }}
                >
                  Start Another Interview
                </Button>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
