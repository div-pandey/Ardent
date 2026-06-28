'use client';

import { motion } from 'framer-motion';
import { Briefcase, ExternalLink, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface JobMatch {
  title: string;
  company: string;
  location: string;
  posted: string;
  match: number;
  tags: string[];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const json = await res.json();
        
        if (json.data) {
          setJobs(json.data);
        } else if (json.error) {
          toast.error(json.error);
        }
      } catch (e) {
        toast.error('Failed to fetch personalized job matches.');
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);
  return (
    <div className="px-8 py-8">
      <motion.div
        className="mx-auto max-w-4xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <h1 className="text-3xl font-bold tracking-tight">Job Matches</h1>
          <p className="mt-1 text-muted-foreground">
            Curated opportunities dynamically matched to your evolving skill graph and target trajectory.
          </p>
        </motion.div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
              Analyzing your skill graph to find tailored matches...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No specific matches found. Try updating your target role or adding more skills!
            </div>
          ) : (
            jobs.map((job, i) => (
              <motion.div
                key={job.title + i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{job.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{job.company}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.posted}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{job.match}%</p>
                  <p className="text-[10px] text-muted-foreground">match</p>
                </div>
              </div>
                <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" /> View Job
                </Button>
              </div>
            </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
