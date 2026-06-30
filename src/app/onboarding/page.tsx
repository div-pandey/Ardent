'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  User,
  Target,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Rocket,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { updateProfile } from '@/actions/auth.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as any;

const EXPERIENCE_LEVELS = [
  { value: 'student', label: 'Student', desc: 'Currently studying or recently graduated', icon: GraduationCap },
  { value: 'entry', label: 'Entry Level', desc: '0–2 years of professional experience', icon: Briefcase },
  { value: 'mid', label: 'Mid Level', desc: '2–5 years of professional experience', icon: Target },
  { value: 'senior', label: 'Senior Level', desc: '5–10 years of professional experience', icon: Rocket },
  { value: 'lead', label: 'Lead / Principal', desc: '10+ years of professional experience', icon: Sparkles },
] as const;

const STEPS = [
  { title: 'Your Name', subtitle: 'How should Ardent address you?' },
  { title: 'Experience Level', subtitle: 'Where are you in your career?' },
  { title: 'Current Role', subtitle: 'What do you do right now?' },
  { title: 'Your Skills', subtitle: 'What are your core strengths?' },
  { title: 'Dream Role', subtitle: 'Where do you want to be?' },
];

const PREDEFINED_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'GraphQL',
  'REST APIs', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Express.js', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', '.NET', 'Ruby on Rails', 'PHP', 'Laravel', 'Swift', 'Kotlin', 'React Native', 'Flutter', 'Dart',
  'Machine Learning', 'Deep Learning', 'Data Analysis', 'Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Computer Vision',
  'NLP', 'MLOps', 'DevOps', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Terraform', 'Ansible', 'Linux',
  'Bash Scripting', 'PowerShell', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'Nginx', 'Apache', 'Microservices', 'System Design',
  'Agile', 'Scrum', 'Kanban', 'Project Management', 'Jira', 'Confluence', 'Trello', 'Product Management', 'Technical Writing', 'Public Speaking',
  'UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'Wireframing', 'Prototyping', 'User Research', 'A/B Testing',
  'Tailwind CSS', 'Sass/SCSS', 'Less', 'Styled Components', 'Webpack', 'Vite', 'Babel', 'Jest', 'Cypress', 'Playwright'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [onboardingTheme, setOnboardingTheme] = useState<'light' | 'dark'>('dark');

  // Form state
  const [fullName, setFullName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Load decoupled onboarding theme
  useEffect(() => {
    const saved = localStorage.getItem('ardent-onboarding-theme') as 'light' | 'dark' | null;
    if (saved) setOnboardingTheme(saved);
  }, []);

  const toggleOnboardingTheme = () => {
    const next = onboardingTheme === 'light' ? 'dark' : 'light';
    setOnboardingTheme(next);
    localStorage.setItem('ardent-onboarding-theme', next);
  };

  // Check auth on mount
  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Pre-fill name from auth metadata
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (name) setFullName(name);

      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name, current_role, target_role, experience_level')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace('/home');
        return;
      }

      // Pre-fill from existing profile data
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.current_role) setCurrentRole(profile.current_role);
      if (profile?.target_role) setTargetRole(profile.target_role);
      if (profile?.experience_level) setExperienceLevel(profile.experience_level);

      setCheckingAuth(false);
    }
    checkUser();
  }, [router]);

  function canProceed(): boolean {
    switch (step) {
      case 0: return fullName.trim().length >= 2;
      case 1: return experienceLevel !== '';
      case 2: return currentRole.trim().length >= 2;
      case 3: return selectedSkills.length > 0;
      case 4: return targetRole.trim().length >= 2;
      default: return false;
    }
  }

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    
    // Support adding multiple comma-separated skills at once
    const newSkills = customSkillInput.split(',').map(s => s.trim()).filter(Boolean);
    let updatedSkills = [...selectedSkills];
    let addedCount = 0;

    newSkills.forEach(skill => {
      // Find matching predefined skill (case-insensitive) to fix user typos
      const predefinedMatch = PREDEFINED_SKILLS.find(s => s.toLowerCase() === skill.toLowerCase());
      const finalSkill = predefinedMatch || skill;
      
      // Check if already selected (case-insensitive)
      const isAlreadySelected = updatedSkills.some(s => s.toLowerCase() === finalSkill.toLowerCase());
      if (!isAlreadySelected) {
        updatedSkills.push(finalSkill);
        addedCount++;
      }
    });

    setSelectedSkills(updatedSkills);
    setCustomSkillInput('');
    
    if (addedCount === 0 && newSkills.length > 0) {
      toast.error('Skill(s) already added.');
    }
  };

  const handleAddPredefinedSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  async function handleComplete() {
    if (!canProceed()) return;
    setLoading(true);

    // 1. Update Supabase profile and user_skills
    const result = await updateProfile({
      full_name: fullName.trim(),
      experience_level: experienceLevel,
      current_role: currentRole.trim(),
      target_role: targetRole.trim(),
      onboarding_completed: true,
      onboarding_step: 5,
      skills: selectedSkills,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    try {
      // 2. Sync roles to Neo4j graph
      await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_roles', currentRole: currentRole.trim(), targetRole: targetRole.trim() }),
      });

      // 3. Sync skills to Neo4j graph
      const formattedSkills = selectedSkills.map(skill => ({
        name: skill,
        proficiency: 'intermediate',
        category: 'technology'
      }));
      await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_skills', skills: formattedSkills }),
      });
    } catch (e) {
      console.error('Failed to initialize career graph:', e);
      // We still proceed even if graph sync fails to not block the user
    }

    toast.success('Welcome to Ardent! Let\'s map your career.');
    // Force a hard reload to ensure layout completely fetches new profile state
    window.location.href = '/home';
  }

  function handleNext() {
    if (!canProceed()) return;
    if (step === STEPS.length - 1) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canProceed()) {
      handleNext();
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <img src="/favicon.ico" alt="Loading..." className="h-6 w-6 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${onboardingTheme} relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground px-6 py-12 transition-colors duration-500`}>
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--ardent-glow) 100%)`,
          }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      </div>

      {/* Floating glass elements */}
      <motion.div
        className="pointer-events-none absolute left-[10%] top-[20%] h-24 w-24 rounded-3xl border border-primary/10 bg-card/20 backdrop-blur-2xl"
        animate={{ rotate: [0, 90, 180, 270, 360], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="pointer-events-none absolute right-[12%] bottom-[25%] h-32 w-32 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-2xl"
        animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <img src="/favicon.ico" alt="Ardent Logo" className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Ardent</span>
          </div>
          <button
            onClick={toggleOnboardingTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Toggle Theme"
          >
            {onboardingTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }}
                transition={{ duration: 0.4, ease }}
              />
            </div>
          ))}
        </div>

        {/* Glassmorphic card */}
        <motion.div
          className="rounded-3xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10 dark:bg-card/60 dark:border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-40 dark:opacity-60" style={{
            background: 'linear-gradient(135deg, hsla(173,80%,40%,0.08) 0%, transparent 40%, transparent 60%, hsla(173,80%,40%,0.04) 100%)'
          }} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
              className="relative z-10"
            >
              {/* Step heading */}
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {STEPS[step].title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {STEPS[step].subtitle}
                </p>
              </div>

              {/* Step content */}
              {step === 0 && (
                <div className="space-y-2" onKeyDown={handleKeyDown}>
                  <Label htmlFor="onboard-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="onboard-name"
                      type="text"
                      placeholder="e.g. Divyansh Pandey"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setExperienceLevel(level.value)}
                      className={cn(
                        'group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
                        experienceLevel === level.value
                          ? 'border-primary bg-primary/10 shadow-[0_0_20px_var(--ardent-glow)]'
                          : 'border-border bg-card/40 hover:border-primary/30 hover:bg-card/60'
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        experienceLevel === level.value ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <level.icon className={cn(
                          'h-5 w-5',
                          experienceLevel === level.value ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm font-bold',
                            experienceLevel === level.value ? 'text-foreground' : 'text-foreground/80'
                          )}>{level.label}</span>
                          {experienceLevel === level.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                            >
                              <Check className="h-3 w-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{level.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2" onKeyDown={handleKeyDown}>
                  <Label htmlFor="onboard-current">Current Role / Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="onboard-current"
                      type="text"
                      placeholder="e.g. Frontend Developer, CS Student, Analyst"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="pl-10 h-12"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    This will be the starting node in your career graph.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6" onKeyDown={handleKeyDown}>
                  <div className="space-y-3">
                    <Label>Select Predefined Skills</Label>
                    <div className="relative border border-border/50 rounded-xl bg-background/50 overflow-hidden">
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 pb-8 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {PREDEFINED_SKILLS.map(skill => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => !isSelected && handleAddPredefinedSkill(skill)}
                              disabled={isSelected}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary opacity-50 cursor-not-allowed" 
                                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                              )}
                            >
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                      {/* Fade out bottom edge to indicate scrollability */}
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-skill">Add Other Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-skill"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        placeholder="e.g. Next.js, GraphQL..."
                        className="h-10"
                        autoComplete="off"
                      />
                      <Button onClick={handleAddCustomSkill} variant="secondary" className="h-10 px-6">Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Selected Skills</Label>
                    <div className="relative w-full rounded-xl border border-border/50 bg-background/50 overflow-hidden shadow-sm">
                      <div className="min-h-14 max-h-32 overflow-y-auto p-3 pb-8 flex flex-wrap gap-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {selectedSkills.length > 0 ? (
                          selectedSkills.map(skill => (
                            <div
                              key={skill}
                              className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md text-sm font-medium shrink-0"
                            >
                              {skill}
                              <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-primary hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors focus:outline-none"
                                aria-label={`Remove ${skill}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm flex items-center h-full">No skills selected yet.</span>
                        )}
                      </div>
                      {/* Fade out bottom edge to indicate scrollability */}
                      {selectedSkills.length > 10 && (
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-2" onKeyDown={handleKeyDown}>
                  <Label htmlFor="onboard-target">Target / Dream Role</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="onboard-target"
                      type="text"
                      placeholder="e.g. Senior Engineer, Product Manager, CTO"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="pl-10 h-12"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Ardent will map the fastest route from here to there.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="relative z-10 mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0}
              className={cn(
                'gap-2 text-muted-foreground h-12 px-6 rounded-full font-medium',
                step === 0 && 'invisible'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="gap-2 bg-primary h-12 px-8 text-base font-medium text-white hover:brightness-110 transition-all shadow-lg shadow-primary/30 rounded-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  Launch Ardent
                  <Rocket className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Step counter */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          {step + 1} of {STEPS.length} — This takes about 30 seconds
        </motion.p>
      </div>
    </div>
  );
}
