'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Route,
  ArrowRight,
  Clock,
  BarChart2,
  Star,
  Check,
  ChevronDown,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface CareerRoute {
  name: string;
  steps: string[];
  totalMonths: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  skillOverlap: number;
  keyNewSkills: string[];
  recommended: boolean;
}


const difficultyColors: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Moderate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const stagger = { initial: {}, animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function PathsPage() {
  const [currentRole, setCurrentRole] = useState('Frontend Developer');
  const [targetRole, setTargetRole] = useState('ML Engineer');
  const [routes, setRoutes] = useState<CareerRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [choosingPath, setChoosingPath] = useState(false);

  async function handleChoosePath(route: CareerRoute) {
    setChoosingPath(true);
    try {
      // 1. Set roles in Neo4j
      await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_roles', currentRole, targetRole }),
      });
      // 2. Redirect to roadmap generation (Part 3)
      window.location.href = `/roadmap?generate=true&target=${encodeURIComponent(targetRole)}`;
    } catch (error) {
      console.error('Failed to choose path:', error);
    } finally {
      setChoosingPath(false);
    }
  }

  async function handleDiscover() {
    if (!currentRole || !targetRole) return;
    setLoading(true);
    setExpandedRoute(0);
    
    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find_paths', currentRole, targetRole }),
      });
      const json = await res.json();
      
      if (json.data) {
        const mappedRoutes: CareerRoute[] = json.data.map((r: any) => ({
          name: r.name,
          steps: r.steps || [],
          totalMonths: r.totalMonths || 0,
          difficulty: r.difficulty === 'hard' ? 'Hard' : r.difficulty === 'moderate' ? 'Moderate' : 'Easy',
          skillOverlap: r.skillOverlap || 0,
          keyNewSkills: r.keyNewSkills || [],
          recommended: r.recommended || false,
        }));
        setRoutes(mappedRoutes);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Failed to discover paths:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8 md:px-8">
      <motion.div className="mx-auto max-w-4xl" variants={stagger} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Career Paths</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover multiple routes from your current role to your dream job.
          </p>
        </motion.div>

        {/* Path Finder */}
        <motion.div variants={fadeUp} className="mt-8 card-interactive">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="paths-current-role" className="text-xs text-muted-foreground">Current Role</Label>
              <Input
                id="paths-current-role"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="bg-white/[0.02] border-white/[0.06]"
              />
            </div>
            <ArrowRight className="mx-2 hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="paths-target-role" className="text-xs text-muted-foreground">Target Role</Label>
              <Input
                id="paths-target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. ML Engineer"
                className="bg-white/[0.02] border-white/[0.06]"
              />
            </div>
            <Button onClick={handleDiscover} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Discover Paths
            </Button>
          </div>
        </motion.div>

        {/* Route Results */}
        <div className="mt-8 space-y-4">
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.01] py-16 text-center">
              <Route className="mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Enter a current role and target role to discover paths.</p>
            </div>
          )}
          
          {hasSearched && routes.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.01] py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">No direct paths found between these roles.</p>
            </div>
          )}

          {routes.map((route, index) => (
            <motion.div
              key={route.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`rounded-2xl border transition-all duration-200 ${
                route.recommended
                  ? 'border-primary/20 glow-accent bg-white/[0.01]'
                  : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]'
              }`}
            >
              {/* Route Header */}
              <button
                className="flex w-full items-center gap-4 p-5 text-left"
                onClick={() => setExpandedRoute(expandedRoute === index ? null : index)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                  <Route className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{route.name}</h3>
                    {route.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        <Star className="h-2.5 w-2.5" /> Recommended
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ~{route.totalMonths} months
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${difficultyColors[route.difficulty]}`}>
                      {route.difficulty}
                    </span>
                    <span>{route.steps.length} steps</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gradient-accent">{route.skillOverlap}%</p>
                  <p className="text-[10px] text-muted-foreground">skill overlap</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expandedRoute === index ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded Detail */}
              {expandedRoute === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/[0.04] px-5 pb-5 pt-4"
                >
                  {/* Route Steps */}
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Route</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {route.steps.map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                          <span className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs font-medium">
                            {step}
                          </span>
                          {i < route.steps.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skill Overlap Bar */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Skill Readiness</span>
                      <span className="font-medium">{route.skillOverlap}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${route.skillOverlap}%` }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                  </div>

                  {/* Key New Skills */}
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Key Skills to Learn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {route.keyNewSkills.map((skill) => (
                        <span key={skill} className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      className="gap-1.5" 
                      onClick={() => handleChoosePath(route)}
                      disabled={choosingPath}
                    >
                      {choosingPath ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} 
                      Choose This Path
                    </Button>
                    <button className="btn-glass text-xs px-4 py-2">View Skill Gap Analysis</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
