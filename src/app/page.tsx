'use client';

import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useInView, animate } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect, MouseEvent } from 'react';
import { Sparkles, Route, Map as MapIcon, Compass, Zap, Shield, ArrowRight, Check, Mail, Target, User, Sun, Moon } from 'lucide-react';
import { TiltCard } from '@/components/ui/tilt-card';
import { Magnetic } from '@/components/ui/magnetic';
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';
import { toast } from 'sonner';

const ease = [0.16, 1, 0.3, 1] as any;

const features = [
  { icon: Sparkles, title: 'Career Graph', desc: 'See your skills mapped as a living constellation.', impact: 'Visualize the invisible.' },
  { icon: Route, title: 'Path Discovery', desc: 'Find multiple routes to your dream job.', impact: 'Every route, one view.' },
  { icon: MapIcon, title: 'Adaptive Roadmaps', desc: 'A learning plan that evolves as you grow.', impact: 'Plans that keep up.' },
  { icon: Compass, title: 'Ardent Guide', desc: 'An AI strategist with full context of your goals.', impact: 'Advice built on data.' },
  { icon: Zap, title: 'Speed to Clarity', desc: 'Full career map in under 2 minutes.', impact: 'Minutes, not months.' },
  { icon: Shield, title: 'Readiness Scoring', desc: 'Real-time readiness percentage for any target.', impact: 'Outcomes, not opinions.' },
];

function FeatureCard({ f, index }: { f: typeof features[0]; index: number }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <TiltCard>
      <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
      className="relative overflow-hidden rounded-3xl border border-border bg-background/[0.02] p-8 backdrop-blur-md transition-transform duration-500 hover:-translate-y-2 hover:border-primary/30"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--ardent-glow), transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors duration-500 group-hover:bg-primary/20">
          <f.icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{f.title}</h3>
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-muted-foreground">{f.desc}</p>
        <div className="mt-8 flex items-center gap-2 border-t border-border pt-6 text-[11px] font-bold tracking-[0.2em] text-primary">
          <span>IMPACT:</span>
          <span className="text-foreground/80">{f.impact}</span>
        </div>
      </div>
    </motion.div>
    </TiltCard>
  );
}

function AnimatedNumber({ value }: { value: string }) {
  const match = value.match(/^([0-9.]+)(.*)$/);
  if (!match) return <>{value}</>;

  const num = parseFloat(match[1]);
  const suffix = match[2];
  const isFloat = match[1].includes('.');

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const count = useMotionValue(0);
  
  useEffect(() => {
    if (isInView) {
      animate(count, num, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, count, num]);

  const display = useTransform(count, (latest) => {
    if (isFloat) return latest.toFixed(1) + suffix;

    const val = Math.floor(latest);
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' + suffix;
    } else if (val >= 1000) {
      return Math.floor(val / 1000) + 'K' + suffix;
    } else {
      return val.toString() + suffix;
    }
  });

  return <motion.span ref={ref}>{display}</motion.span>;
}

function LandingPricingCard({ plan, isYearly, index }: { plan: any; isYearly: boolean; index: number }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const isProOrMax = plan.name === 'Pro' || plan.name === 'Max';
  const displayedPrice = isYearly && plan.name === 'Pro' ? '$12' : isYearly && plan.name === 'Max' ? '$39' : plan.price;
  const displayedDuration = isYearly && isProOrMax ? '/ month, billed annually' : plan.duration;

  return (
    <TiltCard className="h-full">
      <motion.div
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8, delay: index * 0.1, ease }}
      className={`relative flex flex-col rounded-3xl border p-10 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 ${
        plan.badge 
          ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10' 
          : 'border-border bg-background/[0.02] hover:border-primary/30'
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-0">
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute -inset-px transition-opacity duration-300"
              style={{
                background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--ardent-glow), transparent 40%)`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {plan.badge && (
        <motion.div 
          className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground shadow-sm shadow-primary/50"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <span className="relative z-10 flex items-center gap-1.5">
            {plan.badge}
          </span>
          <div className="absolute inset-0 rounded-full border border-border/30 mix-blend-overlay"></div>
        </motion.div>
      )}

      <div className="relative z-10">
        
        <div className="mb-8">
          {plan.badge ? (
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{plan.name}</div>
          ) : (
            <div className="mb-4 inline-block rounded-full bg-card/60 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{plan.name}</div>
          )}
          
          <h3 className="text-4xl font-black tracking-tighter text-foreground">
            {displayedPrice} <span className="text-xl text-slate-500 font-medium">{displayedDuration}</span>
          </h3>
          <p className="mt-4 text-[15px] text-muted-foreground">{plan.description}</p>
        </div>

        <ul className="mb-8 flex-1 space-y-4">
          {plan.features.map((feature: string, idx: number) => (
            <motion.li 
              key={idx} 
              className="flex items-start gap-3 text-[14px] text-foreground/80"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              {plan.badge ? <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />}
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        <Link 
          href={plan.buttonHref}
          className={`mt-10 flex h-14 w-full items-center justify-center rounded-xl font-bold transition-all ${
            plan.badge 
              ? 'bg-primary text-foreground hover:scale-[1.02] shadow-lg shadow-primary/30' 
              : 'border border-border bg-transparent text-foreground hover:bg-card/60'
          }`}
        >
          {plan.icon && <plan.icon className="mr-2 h-4 w-4" />}
          {plan.buttonText}
        </Link>
      </div>
      </motion.div>
    </TiltCard>
  );
}

const landingPlans = [
  {
    name: 'Starter',
    price: '$0',
    duration: 'forever',
    description: 'Perfect for exploring your career graph.',
    features: ['3 AI Roadmaps per day', '5 Resume Parses per day', '10 Mentorship messages/hr', 'Standard Graph Features'],
    buttonText: 'Get Started Free',
    buttonHref: '/plans',
    disabled: false,
  },
  {
    name: 'Pro',
    price: '$15',
    duration: '/ month',
    description: 'For serious career transitions.',
    badge: 'Most Popular',
    features: ['Unlimited AI Roadmaps', 'Unlimited Resume Parsing', 'Priority AI Mentorship Context', 'Early access to new models'],
    buttonText: 'Upgrade to Pro',
    buttonHref: '/plans',
    disabled: false,
  },
  {
    name: 'Max',
    price: '$49',
    duration: '/ month',
    description: 'Ultimate power for power users.',
    features: ['Everything in Pro', 'Dedicated Graph Embeddings', 'Infinite Mentorship History', 'Priority Access to Sarvam-105b'],
    buttonText: 'Upgrade to Max',
    buttonHref: '/plans',
    disabled: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    duration: 'pricing',
    description: 'For teams and organizations.',
    features: ['Organization-wide Graph', 'Custom Role Definitions', 'Team Skill Gap Analytics', 'Dedicated Success Manager'],
    buttonText: 'Contact Organizer',
    buttonHref: 'mailto:div.pandey.css@gmail.com?subject=Ardent Enterprise Inquiry',
    icon: Mail,
    disabled: false,
  },
];

import { useTheme } from 'next-themes';

const ardentFunFacts = [
  "✨ Ardent's career graph is powered by Neo4j — the same database NASA uses for mission planning.",
  "🔥 The name 'Ardent' means 'intensely passionate' — just like your career drive.",
  "🧠 Ardent's AI can map your entire resume into a skill graph in under 2 seconds.",
  "🌐 Every career path on Ardent is generated from analyzing millions of real professional trajectories.",
  "⚡ The first prototype of Ardent was built in a single weekend hackathon.",
  "🎯 Ardent's readiness scoring has a 98% accuracy rate against real job descriptions.",
  "🚀 Over 2 million data points are mapped in Ardent's career intelligence engine.",
  "💡 Fun fact: The Ardent logo sparkle has exactly 4 points — one for each pillar: Map, Learn, Build, Launch.",
  "🎨 Ardent's dark mode was designed to reduce eye strain during late-night career planning sessions.",
  "🔮 Ardent can predict skill gaps up to 3 career transitions ahead of where you are now.",
];

export default function LandingPage() {
  const containerRef = useRef(null);
  const [isYearly, setIsYearly] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [funFactIndex, setFunFactIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 100) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast(ardentFunFacts[funFactIndex], {
        icon: '💎',
        duration: 4000,
      });
      setFunFactIndex((prev) => (prev + 1) % ardentFunFacts.length);
    }
  };
  
  // Parallax for Hero Elements
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const yText = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const yShapes = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground transition-colors duration-500 selection:bg-primary/30 selection:text-foreground">
      
      {/* Landing Page Background Override */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: mounted && theme === 'light' 
            ? `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--primary) 100%)`
            : `radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--ardent-glow) 100%)`,
        }}
      />

      {/* ── THE CONTENT WRAPPER ── */}
      <div ref={containerRef} className="relative z-10 bg-transparent">
        
        {/* ── GLOBAL NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent/50 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <button onClick={handleLogoClick} className="group flex items-center gap-3 cursor-pointer" aria-label="Ardent Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-500 group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                <img src="/favicon.ico" alt="Ardent" className="h-6 w-6 transition-all duration-500 group-hover:brightness-0 group-hover:invert" />
              </div>
              <span className="relative text-xl font-bold tracking-tighter text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">ARDENT</span>
            </button>

            <div className="hidden items-center gap-10 md:flex">
              {['Platform', 'Impact', 'Pricing', 'Reviews'].map((item) => (
                <a key={item} href={`#${item.toLowerCase() === 'reviews' ? 'faq' : item.toLowerCase()}`} className="group/link relative text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-foreground">
                  {item}
                  <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover/link:w-full"></span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {mounted && (
                <Magnetic>
                  <button 
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                    aria-label="Toggle Theme"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </Magnetic>
              )}
              <Link href="/login" className="group/link relative hidden text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-300 hover:text-foreground sm:inline-block">
                Sign In
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover/link:w-full"></span>
              </Link>
              <Magnetic>
                <Link href="/register" className="btn-glass px-6 py-3 bg-primary text-white hover:brightness-110 transition-all duration-300">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Get Started</span>
                </Link>
              </Magnetic>
            </div>
          </div>
        </nav>

        {/* ── THE REDSUN HERO ── */}
        <section className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
          
          {/* Ambient Glows */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ 
              background: 'radial-gradient(circle, var(--ardent-glow) 0%, transparent 60%)',
              filter: 'blur(100px)'
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* 3D Floating Glass Elements */}
          <motion.div style={{ y: yShapes }} className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <motion.div 
              className="absolute left-[15%] top-[25%] h-32 w-32 rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl"
              animate={{ rotate: [0, 90, 180, 270, 360], y: [0, -30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div 
              className="absolute right-[15%] bottom-[30%] h-48 w-48 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-2xl shadow-lg shadow-primary/20"
              animate={{ y: [0, 40, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.div 
            className="relative z-10 mx-auto w-full max-w-6xl text-center"
            style={{ y: yText, opacity: opacityHero }}
          >

            {/* Typography */}
            <div className="mx-auto max-w-5xl">
              <motion.h1
                className="text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.9] tracking-tighter text-foreground"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }}
              >
                NAVIGATE YOUR
              </motion.h1>
              <motion.h1
                className="text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.9] tracking-tighter"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[var(--ardent-accent-light)] to-white drop-shadow-lg dark:drop-shadow-none">CAREER GRAPH.</span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease }}
              className="mx-auto mt-8 max-w-2xl text-[clamp(1rem,2vw,1.25rem)] font-medium leading-relaxed text-muted-foreground"
            >
              Ardent maps the invisible connections between your skills, your goals, and the steps in between. Powerful AI built on Neo4j.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease }}
              className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row"
            >
              <Magnetic>
                <Link href="/register" className="group relative flex h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-10 text-[13px] font-bold uppercase tracking-[0.1em] text-white hover:brightness-110 transition-all duration-300 hover:scale-105">
                  <span className="relative z-10">Start Mapping</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </motion.div>
          </motion.div>
        </section>

        {/* ── MASSIVE SCROLLING MARQUEE (CURVED) ── */}
        <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-transparent pt-10 pb-0 pointer-events-none">
          <div className="relative flex w-full justify-center">
            <svg viewBox="0 0 1000 280" className="w-[150vw] min-w-[1400px] h-[250px] md:h-[350px] opacity-80" preserveAspectRatio="xMidYMax slice">
              {/* Top Border */}
              <path d="M 0,20 Q 500,200 1000,20" fill="transparent" className="stroke-border/40" strokeWidth="1" />
              {/* Bottom Border */}
              <path d="M 0,100 Q 500,280 1000,100" fill="transparent" className="stroke-border/40" strokeWidth="1" />
              
              {/* Invisible Text Path */}
              <path id="text-curve" d="M 0,72 Q 500,252 1000,72" fill="transparent" />
              
              <text className="text-[35px] font-black uppercase tracking-[0.2em] fill-foreground/5 md:text-[45px]">
                <textPath href="#text-curve" startOffset="0%">
                  DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE. DISCOVER. MAP. ACCELERATE.
                  <animate attributeName="startOffset" from="0%" to="-100%" dur="30s" repeatCount="indefinite" />
                </textPath>
              </text>
            </svg>
          </div>
        </section>

        {/* ── FEATURES (BENTO GRID) ── */}
        <section id="platform" className="relative border-t border-border/40 bg-card/40 backdrop-blur-md px-6 py-40">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, ease }}
              className="mb-24 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between"
            >
              <div className="max-w-3xl">
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                  POWERFUL INTELLIGENCE.<br />
                  <span className="text-foreground/20">BEAUTIFUL CLARITY.</span>
                </h2>
              </div>
              <p className="max-w-sm text-[15px] font-medium leading-relaxed text-muted-foreground">
                Explore the frontier of career mapping. Six core features designed to give you an unfair advantage in the tech industry.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard key={f.title} f={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── PATH DISCOVERY ── */}
        <section id="discovery" className="relative border-t border-border/40 bg-transparent px-6 py-32 overflow-hidden">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-16">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, ease }}>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-tighter text-foreground">
                PATH <span className="text-primary">DISCOVERY.</span>
              </h2>
              <p className="mt-6 text-[15px] font-medium leading-relaxed text-muted-foreground">
                Stop guessing your next career move. Our Neo4j-powered engine analyzes millions of professional trajectories to map out the exact stepping stones between where you are and where you want to be.
              </p>
            </motion.div>
            <TiltCard className="flex-1 w-full">
              <motion.div className="relative aspect-square md:aspect-video w-full rounded-3xl border border-border shadow-2xl bg-card/70 overflow-hidden backdrop-blur-2xl p-8" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, delay: 0.2, ease }}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--ardent-glow)_0%,transparent_70%)]" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
               
               <div className="relative z-10 flex flex-col h-full justify-center pl-4 sm:pl-10">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[34px] sm:left-[58px] top-[25%] bottom-[25%] w-[2px] bg-gradient-to-b from-primary/10 via-primary to-primary/10 rounded-full" />
                  
                  <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="relative flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-md border border-primary/20 z-10">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 h-12 sm:h-14 rounded-2xl bg-card/80 border border-border flex items-center px-4 sm:px-6 shadow-sm"><span className="text-muted-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">Current: SDE I</span></div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.7 }} className="relative flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary shadow-[0_0_20px_var(--ardent-glow)] border border-primary/20 z-10">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 h-14 sm:h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center px-4 sm:px-6 shadow-[0_0_30px_var(--ardent-glow)]"><span className="text-primary text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">Step 1: Master Sys Design</span></div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.9 }} className="relative flex items-center gap-4 sm:gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-md border border-primary/20 z-10">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 h-12 sm:h-14 rounded-2xl bg-card/80 border border-border flex items-center px-4 sm:px-6 shadow-sm"><span className="text-muted-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">Target: Senior Eng</span></div>
                  </motion.div>
               </div>
            </motion.div>
            </TiltCard>
          </div>
        </section>

        {/* ── AI GUIDE ── */}
        <section id="guide" className="relative border-t border-border/40 bg-card/40 backdrop-blur-md px-6 py-32 overflow-hidden">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row-reverse items-center gap-16">
            <motion.div className="flex-1" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, ease }}>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-tighter text-foreground">
                MEET YOUR <span className="text-primary">AI GUIDE.</span>
              </h2>
              <p className="mt-6 text-[15px] font-medium leading-relaxed text-muted-foreground">
                A mentor that never sleeps. Powered by Sarvam AI, your guide has full context of your entire resume, your skill gaps, and your target roles before you even type a single word.
              </p>
            </motion.div>
            <TiltCard className="flex-1 w-full">
              <motion.div className="relative aspect-square md:aspect-video w-full rounded-3xl border border-border shadow-2xl bg-card/70 overflow-hidden backdrop-blur-2xl p-4 sm:p-6" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, delay: 0.2, ease }}>
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--ardent-glow)_0%,transparent_70%)]" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
               
               <div className="relative z-10 flex flex-col gap-4 h-full justify-center">
                  {/* User Message */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="flex gap-3 self-end w-5/6 sm:w-3/4 justify-end">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">You</span>
                      <div className="p-4 rounded-2xl rounded-tr-sm bg-foreground text-[13px] text-popover shadow-lg leading-relaxed">
                        How do I transition to Product Management?
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* AI Response */}
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 1.5 }} className="flex gap-3 self-start w-full sm:w-5/6">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-sm mt-5">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Ardent Guide</span>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-background border border-border text-[13px] text-muted-foreground shadow-xl leading-relaxed">
                        Based on your 3 years of frontend experience, I suggest starting by bridging the gap with user analytics. Let's look at your roadmap...
                      </div>
                    </div>
                  </motion.div>

                  {/* Typing Indicator */}
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 2 }} className="flex gap-3 self-start items-center ml-11">
                    <div className="flex gap-1 px-3 py-2 rounded-full bg-background/50 border border-border shadow-sm">
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  </motion.div>
               </div>
            </motion.div>
            </TiltCard>
          </div>
        </section>

        {/* ── READINESS ── */}
        <section id="readiness" className="relative border-t border-border/40 bg-transparent px-6 py-32 overflow-hidden">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-16">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, ease }}>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-tighter text-foreground">
                READINESS <span className="text-primary">SCORING.</span>
              </h2>
              <p className="mt-6 text-[15px] font-medium leading-relaxed text-muted-foreground">
                Stop applying in the dark. We parse your live resume against real-time industry job descriptions to give you a definitive readiness score and highlight exactly which skills you are missing.
              </p>
            </motion.div>
            <TiltCard className="flex-1 w-full h-full">
              <motion.div className="relative flex items-center justify-center aspect-square md:aspect-video w-full rounded-3xl border border-border shadow-2xl bg-card/70 overflow-hidden backdrop-blur-2xl p-8" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, delay: 0.2, ease }}>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--ardent-glow)_0%,transparent_70%)]" />
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                 
                 {/* Scanner Line removed per user request */}

                 {/* Floating Tags */}
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="absolute top-[15%] left-[10%] px-3 py-1.5 rounded-lg bg-card/80 border border-border shadow-sm z-10">
                   <span className="text-[10px] font-bold text-muted-foreground">React: <span className="text-primary">95%</span></span>
                 </motion.div>
                 <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[20%] right-[10%] px-3 py-1.5 rounded-lg bg-card/80 border border-border shadow-sm z-10">
                   <span className="text-[10px] font-bold text-muted-foreground">Node.js: <span className="text-primary">70%</span></span>
                 </motion.div>
                 <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-[20%] right-[15%] px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 shadow-sm z-10">
                   <span className="text-[10px] font-bold text-primary animate-pulse">Analyzing...</span>
                 </motion.div>

                 <div className="relative z-10 flex flex-col items-center justify-center mt-4">
                    <div className="relative flex items-center justify-center h-48 w-48 sm:h-56 sm:w-56">
                      <svg className="absolute inset-0 h-full w-full -rotate-90 transform drop-shadow-[0_0_15px_var(--ardent-glow)]" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle cx="50" cy="50" r="40" className="stroke-border/20" strokeWidth="8" fill="transparent" />
                        {/* Progress Arc */}
                        <motion.circle 
                          cx="50" cy="50" r="40" 
                          className="stroke-primary" 
                          strokeWidth="8" fill="transparent" 
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                          whileInView={{ strokeDashoffset: "40.19" }} // 84% fill
                          viewport={{ once: true, margin: "-10%" }}
                          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                        />
                      </svg>
                      <div className="flex flex-col items-center justify-center text-center mt-2">
                        <span className="text-5xl sm:text-6xl font-black text-foreground tracking-tighter">
                          84<span className="text-2xl sm:text-3xl font-bold text-muted-foreground">%</span>
                        </span>
                        <span className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground mt-1">Readiness</span>
                      </div>
                    </div>
                    <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">Senior React Dev</span>
                 </div>
              </motion.div>
            </TiltCard>
          </div>
        </section>

        {/* ── ABOUT SECTION ── */}
        <section id="about" className="relative border-y border-border/40 bg-card/40 backdrop-blur-md px-6 py-40 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <motion.div className="relative z-10 mx-auto max-w-4xl text-center" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/60 border border-border/40">
              <Sparkles className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
              OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ardent-accent-dark)] to-[var(--ardent-accent-light)]">MISSION.</span>
            </h2>
            <p className="mt-8 text-[clamp(1.1rem,2vw,1.5rem)] font-medium leading-relaxed text-muted-foreground">
              We built Ardent because the modern career ladder is broken. It's no longer a straight line, it's a complex, multi-dimensional graph. Our mission is to democratize elite career intelligence, giving everyone the tools to navigate their professional journey with absolute clarity and precision.
            </p>
          </motion.div>
        </section>

        {/* ── MASSIVE METRICS ── */}
        <section id="impact" className="relative overflow-hidden border-t border-border/40 bg-transparent px-6 py-40">
          <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-[0.03]">
            <h2 className="text-[25vw] font-black leading-none tracking-tighter text-foreground/5">QUANTIFIED</h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, ease }}
            className="relative mx-auto mb-24 max-w-7xl text-center md:text-left"
          >
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
              MEASURABLE <span className="text-foreground/20">IMPACT.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] font-medium leading-relaxed text-muted-foreground">
              The numbers speak for themselves. This is how Ardent is accelerating career growth across the industry.
            </p>
          </motion.div>

          <div className="relative mx-auto grid max-w-7xl gap-16 md:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '2000000+', label: 'DATA POINTS MAPPED' },
              { value: '1.4x', label: 'FASTER TRANSITIONS' },
              { value: '98%', label: 'SKILL ACCURACY' },
              { value: <><AnimatedNumber value="24" />/<AnimatedNumber value="7" /></>, label: 'AI MENTORSHIP' },
            ].map((stat, i) => (
              <TiltCard key={stat.label}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, delay: i * 0.1, ease }}
                  className="flex flex-col border-l-2 border-primary/50 pl-8 bg-card/10 p-6 rounded-2xl"
                >
                  <div className="text-5xl font-black tracking-tighter text-foreground lg:text-7xl">
                    {typeof stat.value === 'string' ? <AnimatedNumber value={stat.value} /> : stat.value}
                  </div>
                  <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{stat.label}</div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ── PRICING SECTION ── */}
        <section id="pricing" className="relative border-t border-border/40 bg-transparent px-6 py-40">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, ease }}
              className="mb-24 text-center"
            >
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                SIMPLE, TRANSPARENT <br />
                <span className="text-foreground/20">PRICING.</span>
              </h2>

              <div className="mt-10 flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                <button 
                  onClick={() => setIsYearly(!isYearly)}
                  className="relative inline-flex h-7 w-14 items-center rounded-full bg-card/70 p-1 transition-colors hover:bg-background/20 focus:outline-none"
                >
                  <span 
                    className={`inline-block h-5 w-5 transform rounded-full bg-primary transition-transform shadow-sm shadow-primary/50 ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} 
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Annually</span>
                  <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30">Save 20%</span>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:max-w-7xl lg:mx-auto">
              {landingPlans.map((plan, i) => (
                <LandingPricingCard key={plan.name} plan={plan} isYearly={isYearly} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section id="faq" className="relative border-t border-border/40 bg-card/40 backdrop-blur-md py-40 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, ease }}
              className="mb-16 text-center"
            >
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                WHAT PEOPLE <span className="text-primary">SAY.</span>
              </h2>
            </motion.div>
          </div>

          <div className="w-full max-w-none">
            <AnimatedTestimonials
              data={[
                {
                  description:
                    "Ardent has completely transformed how I navigate my career. The career graph is incredibly insightful, and the AI mentorship is game-changing.",
                  image:
                    "https://images.unsplash.com/photo-1611558709798-e009c8fd7706?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Isabelle Carlos",
                  handle: "@isabellecarlos",
                },
                {
                  description:
                    "I love how Ardent makes career planning so actionable with minimal effort. The Neo4j graph reveals paths I never knew existed.",
                  image:
                    "https://plus.unsplash.com/premium_photo-1692340973636-6f2ff926af39?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Lana Akash",
                  handle: "@lanaakash",
                },
                {
                  description:
                    "The real-time readiness scoring and intuitive AI guide in Ardent save me hours of guessing what skills I need next!",
                  image:
                    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Liam O’Connor",
                  handle: "@liamoc",
                },
                {
                  description:
                    "Using Ardent feels like magic — it’s so easy to visualize my career trajectory and pinpoint exact skill gaps.",
                  image:
                    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Isabella Mendes",
                  handle: "@isamendes",
                },
                {
                  description:
                    "Ardent’s AI guide feels like having a personal career strategist 24/7. The personalized roadmaps are outstanding.",
                  image:
                    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Meera Patel",
                  handle: "@meerapatel",
                },
                {
                  description:
                    "I recommend Ardent to everyone looking for a powerful, intelligent platform to accelerate their career growth.",
                  image:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Emily Chen",
                  handle: "@emchen",
                },
                {
                  description:
                    "I was stuck in my current role for 3 years. Ardent's Path Discovery showed me a direct route to Senior Engineering I never considered.",
                  image:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Marcus Johnson",
                  handle: "@marcusj_dev",
                },
                {
                  description:
                    "The Neo4j backend makes the skill mapping incredibly fast. It scanned my resume and built my entire profile in 10 seconds.",
                  image:
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Sarah Lin",
                  handle: "@sarah_codes",
                },
                {
                  description:
                    "I used the Ardent AI Guide to prep for my interviews. It knew my exact weak points based on the target job description. Highly recommended!",
                  image:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "David Kim",
                  handle: "@davidk",
                },
                {
                  description:
                    "This is by far the most beautiful career tool I've used. The dark mode graph visualization is stunning, and the insights are actually actionable.",
                  image:
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Elena Rodriguez",
                  handle: "@elenar",
                },
                {
                  description:
                    "Finally, a tool that doesn't just give generic advice. The personalized learning roadmap adapted exactly to my pace and timeline.",
                  image:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "James Wilson",
                  handle: "@jwilson_tech",
                },
                {
                  description:
                    "Ardent bridged the gap between my self-taught projects and enterprise requirements. The readiness score gave me the confidence to apply.",
                  image:
                    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
                  name: "Chloe Smith",
                  handle: "@chloesmith",
                },
              ]}
            />
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-0 flex flex-col justify-end bg-transparent px-6 pb-12 pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--ardent-glow)_0%,transparent_50%)]" />
        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-between">
          
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-[clamp(3rem,5vw,5rem)] font-black leading-[0.9] tracking-tighter text-foreground">
                READY TO SCALE <br/><span className="text-primary">YOUR CAREER?</span>
              </h2>
              <div className="mt-10">
                <Magnetic>
                  <Link href="/register" className="inline-flex h-16 items-center justify-center rounded-full bg-primary px-10 text-[13px] font-bold uppercase tracking-[0.1em] text-white hover:brightness-110 transition-all duration-300 hover:scale-105">
                    Join the Future
                  </Link>
                </Magnetic>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div>
                <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Platform</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'Intelligence Graph', href: '#platform' },
                    { name: 'Path Discovery', href: '#discovery' },
                    { name: 'AI Guide', href: '#guide' },
                    { name: 'Readiness', href: '#readiness' }
                  ].map(l => (
                    <li key={l.name}><a href={l.href} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">{l.name}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Company</h4>
                <ul className="space-y-4">
                  {[
                    { name: 'About', href: '#about' },
                    { name: 'Blog', onClick: () => toast('Coming up soon! We are cooking something interesting 🍳') },
                    { name: 'Careers', onClick: () => toast('We are currently not hiring, but check back soon! 🚀') },
                    { name: 'Contact', href: 'mailto:div.pandey.css@gmail.com' }
                  ].map(l => (
                    <li key={l.name}>
                      {l.onClick ? (
                        <button onClick={l.onClick} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left">{l.name}</button>
                      ) : (
                        <a href={l.href} target={l.href?.startsWith('http') ? '_blank' : '_self'} className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">{l.name}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between border-t border-border/40 pt-10 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-black tracking-tighter text-foreground">ARDENT</span>
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 md:mt-0">
              © 2026 ARDENT INTELLIGENCE. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
