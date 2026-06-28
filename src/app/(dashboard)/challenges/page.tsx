'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, CheckCircle2, XCircle, Flame, ChevronRight, Loader2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ChallengesPage() {
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [challengesData, setChallengesData] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [needsRoadmap, setNeedsRoadmap] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch('/api/challenges');
        const json = await res.json();
        
        if (json.requireRoadmap) {
          setNeedsRoadmap(true);
        } else if (json.success) {
          setChallengesData(json.challenge);
          if (json.challenge.is_completed) {
            setCompletedToday(true);
          }
          // Fetch streak from profile
          if (json.streak !== undefined) {
            setStreak(json.streak);
          }
        } else {
          toast.error(json.error || 'Failed to load challenges');
        }
      } catch (e) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchChallenges();
  }, []);

  const challenges = challengesData?.questions || [];
  const currentChallenge = challenges[activeChallengeIndex];

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Track correct answers
    if (selectedAnswer === currentChallenge?.correctIndex) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (activeChallengeIndex < challenges.length - 1) {
      setIsSubmitted(false);
      setSelectedAnswer(null);
      setActiveChallengeIndex(prev => prev + 1);
    } else {
      // Finished all — calculate score as percentage
      const totalQuestions = challenges.length;
      const scorePercent = Math.round((correctCount / totalQuestions) * 100);
      try {
        const res = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            challengeId: challengesData.id,
            score: scorePercent
          })
        });
        const json = await res.json();
        if (json.success) {
          setCompletedToday(true);
          setStreak(json.current_streak);
          toast.success(`Challenges completed! Streak: ${json.current_streak} 🔥`);
        }
      } catch (e) {
        toast.error('Failed to save progress');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Generating your daily challenges...</p>
      </div>
    );
  }

  if (needsRoadmap) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-6 text-center">
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <Map className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No Active Roadmap</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          First, choose a roadmap you think you are going to work on. Your daily challenges are tailor-made based on your active daily goals!
        </p>
        <Link href="/roadmap">
          <Button size="lg" className="rounded-xl px-8">Go to Roadmap</Button>
        </Link>
      </div>
    );
  }

  if (completedToday) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-6 text-center">
        <div className="bg-emerald-500/10 p-4 rounded-full mb-6 border border-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">All Done for Today!</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          You've completed today's micro-challenges. Your streak is safe. Come back tomorrow for a new set of challenges based on your next daily goal.
        </p>
        <div className="flex items-center gap-2 justify-center bg-rose-500/10 px-6 py-3 rounded-xl border border-rose-500/20">
          <Flame className="h-6 w-6 text-rose-500" />
          <span className="text-xl font-bold text-rose-500">{streak > 0 ? streak : 'Active'} Day Streak</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center overflow-hidden bg-background">
      
      {/* Header */}
      <div className="w-full max-w-lg px-6 py-6 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="bg-amber-400/10 p-1.5 rounded-lg border border-amber-400/20">
            <Swords className="h-5 w-5 text-amber-400" />
          </div>
          <span className="font-bold tracking-tight">Daily Micro-Challenges</span>
        </div>
        <div className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
          <Flame className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-bold text-rose-500">{streak > 0 ? `${streak} Day Streak` : 'Keep it burning!'}</span>
        </div>
      </div>

      {/* Challenge Feed Area */}
      <div className="flex-1 w-full max-w-lg p-6 flex flex-col overflow-y-auto pb-24 pt-8">
        
        {currentChallenge && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChallengeIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full shrink-0 rounded-2xl bg-card border border-border/60 shadow-xl overflow-hidden flex flex-col mb-8"
          >
            {/* Question Area */}
            <div className="p-6 pb-0">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                Challenge {activeChallengeIndex + 1} of {challenges.length}
              </span>
              <p className="text-[10px] text-muted-foreground mb-4">Topic: {challengesData?.task_title}</p>
              <h2 className="text-lg font-medium leading-snug mb-4">{currentChallenge.question}</h2>
            </div>
            
            {/* Code Snippet */}
            {currentChallenge.codeSnippet && (
              <div className="px-6 mb-4">
                <div className="rounded-xl bg-zinc-950 p-4 overflow-x-auto border border-zinc-800">
                  <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
                    <code>{currentChallenge.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="p-6 pt-0 space-y-3">
              {currentChallenge.options.map((opt: string, i: number) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === currentChallenge.correctIndex;
                let bgState = "bg-muted/50 border-border hover:border-primary/50 hover:bg-muted";
                
                if (isSubmitted) {
                  if (isCorrect) bgState = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
                  else if (isSelected) bgState = "bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400";
                  else bgState = "bg-muted/30 border-border/50 opacity-50";
                } else if (isSelected) {
                  bgState = "bg-primary/10 border-primary text-primary";
                }

                return (
                  <button
                    key={i}
                    disabled={isSubmitted}
                    onClick={() => setSelectedAnswer(i)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3 ${bgState}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSubmitted && isCorrect ? <CheckCircle2 className="h-4 w-4" /> : 
                       isSubmitted && isSelected ? <XCircle className="h-4 w-4" /> :
                       <div className={`h-4 w-4 rounded-full border ${isSelected ? 'border-primary border-4' : 'border-muted-foreground/50'}`} />}
                    </div>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation & Action */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-muted/30 border-t border-border/50 p-6"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong className={selectedAnswer === currentChallenge.correctIndex ? "text-emerald-500" : "text-rose-500"}>
                      {selectedAnswer === currentChallenge.correctIndex ? "Correct! " : "Not quite. "}
                    </strong>
                    {currentChallenge.explanation}
                  </p>
                  <Button className="w-full rounded-xl" onClick={handleNext}>
                    {activeChallengeIndex < challenges.length - 1 ? (
                      <>Next Challenge <ChevronRight className="h-4 w-4 ml-1" /></>
                    ) : (
                      <>Finish & Save 🔥</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
        )}

        {/* Submit Button (outside card if not submitted) */}
        {!isSubmitted && (
          <div className="mt-6">
            <Button 
              size="lg" 
              className="w-full rounded-xl py-6 font-bold shadow-lg"
              disabled={selectedAnswer === null}
              onClick={handleSubmit}
            >
              Check Answer
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
