'use client';

import { useState, MouseEvent, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Building2, Sparkles, Mail, CreditCard, Clock, CheckCircle2, Crown, BarChart3, Shield, ArrowUpRight, Mic, Terminal as TerminalIcon, BookOpen, FileText, MessageSquare, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { staggerContainer, staggerItem } from '@/lib/motion';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { TIER_CONFIG, TierName } from '@/lib/tiers';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    duration: 'forever',
    description: 'Perfect for exploring your career graph.',
    features: [
      'Save up to 3 Roadmaps',
      'Generate 1 Roadmap / month',
      '5 Resume Parses per day',
      '10 Mentorship Msgs / hour',
      '3 Daily Micro-Challenges',
      '1 AI Mock Interview / month',
      '1 Day in the Life Scenario / month',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline' as const,
    disabled: true,
  },
  {
    name: 'Pro',
    price: '$15',
    duration: '/ month',
    description: 'For serious career transitions.',
    badge: 'Most Popular',
    features: [
      'Save up to 15 Roadmaps',
      'Generate 5 Roadmaps / month',
      '15 Resume Parses per day',
      '50 Mentorship Msgs / hour',
      '5 Code Micro-Challenges / day',
      '5 AI Mock Interviews / month',
      '5 Day in the Life Scenarios / month',
      'Verifiable Completion Certificates',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default' as const,
  },
  {
    name: 'Max',
    price: '$49',
    duration: '/ month',
    description: 'Ultimate power for power users.',
    features: [
      'Save up to 100 Roadmaps',
      'Generate 25 Roadmaps / month',
      '50 Resume Parses per day',
      'Unlimited Mentorship Msgs',
      '5 Deep-Dive Micro-Challenges / day',
      'Unlimited AI Mock Interviews',
      'Unlimited Scenarios (High Complexity)',
      'Exclusive System Design Interviews',
      'Verifiable Completion Certificates',
    ],
    buttonText: 'Upgrade to Max',
    buttonVariant: 'secondary' as const,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    duration: 'pricing',
    description: 'For teams and organizations.',
    features: [
      'Organization-wide Graph',
      'Custom Role Definitions',
      'Team Skill Gap Analytics',
      'Dedicated Success Manager',
      'SLA Support'
    ],
    buttonText: 'Contact Organizer',
    buttonVariant: 'outline' as const,
    icon: Mail,
  },
];

function DashboardPricingCard({ plan, isYearly, getPrice, getDuration }: { plan: any, isYearly: boolean, getPrice: any, getDuration: any }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const handleCheckout = async () => {
    if (plan.name === 'Enterprise') {
      window.location.href = 'mailto:div.pandey.css@gmail.com?subject=Ardent Enterprise Inquiry';
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to upgrade.');
        setIsLoading(false);
        return;
      }

      toast.loading('Initializing secure checkout...', { id: 'checkout' });

      // 1. Create order
      const orderRes = await fetch('/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planName: plan.name, 
          isYearly, 
          userId: session.user.id 
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Open Razorpay modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890abcd',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ardent',
        description: `Upgrade to ${plan.name} Plan`,
        order_id: orderData.id,
        handler: async function (response: any) {
          toast.loading('Verifying payment...', { id: 'checkout' });
          
          const verifyRes = await fetch('/api/checkout/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: session.user.id,
              planName: plan.name
            }),
          });

          if (verifyRes.ok) {
            toast.success('Upgrade successful! Welcome to ' + plan.name, { id: 'checkout' });
            window.location.reload();
          } else {
            toast.error('Payment verification failed. Please contact support.', { id: 'checkout' });
          }
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: '#14B8A6',
        },
        modal: {
          ondismiss: function() {
            toast.dismiss('checkout');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment cancelled or failed.', { id: 'checkout' });
      });
      
      toast.dismiss('checkout');
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.', { id: 'checkout' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={staggerItem}
      className={`relative flex flex-col rounded-3xl border p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 ${
        plan.badge 
          ? 'border-primary/50 bg-primary/5 shadow-[0_0_30px_rgba(20, 184, 166,0.1)]' 
          : 'border-border bg-card hover:border-primary/30'
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
                background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(20, 184, 166, 0.15), transparent 40%)`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {plan.badge && (
        <motion.div 
          className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-[0_0_20px_rgba(20, 184, 166,0.5)]"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            boxShadow: ['0px 0px 20px rgba(20, 184, 166,0.4)', '0px 0px 40px rgba(20, 184, 166,0.8)', '0px 0px 20px rgba(20, 184, 166,0.4)'] 
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <span className="relative z-10 flex items-center gap-1.5">
            {plan.badge}
          </span>
          <div className="absolute inset-0 rounded-full border border-white/30 mix-blend-overlay"></div>
        </motion.div>
      )}

      <div className="relative z-10">
        
        <div className="mb-8">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black">{getPrice(plan.name, plan.price)}</span>
            <span className="text-sm font-medium text-muted-foreground">{getDuration(plan.name, plan.duration)}</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>
        </div>

        <ul className="mb-8 flex-1 space-y-4">
          {plan.features.map((feature: string, idx: number) => (
            <motion.li 
              key={idx} 
              className="flex items-start gap-3 text-sm font-medium text-foreground/80"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        <Button 
          variant={plan.buttonVariant} 
          className={`w-full rounded-xl py-6 font-bold ${plan.badge ? 'shadow-[0_0_20px_rgba(20, 184, 166,0.3)] hover:scale-[1.02] transition-transform' : ''}`}
          disabled={plan.disabled || isLoading}
          onClick={handleCheckout}
        >
          {plan.icon && <plan.icon className="mr-2 h-4 w-4" />}
          {isLoading ? 'Processing...' : plan.buttonText}
        </Button>
      </div>
    </motion.div>
  );
}

export default function PlansPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [loadingTier, setLoadingTier] = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();
          if (profile?.subscription_tier) {
            setCurrentTier(profile.subscription_tier);
          }
        }
      } catch (err) {
        console.error('Error fetching tier:', err);
      } finally {
        setLoadingTier(false);
      }
    };
    fetchTier();
  }, []);

  // Dynamic pricing based on billing cycle
  const getPrice = (planName: string, basePrice: string) => {
    if (planName === 'Starter' || planName === 'Enterprise') return basePrice;
    if (isYearly) {
      if (planName === 'Pro') return '$12';
      if (planName === 'Max') return '$39';
    }
    return basePrice;
  };

  const getDuration = (planName: string, baseDuration: string) => {
    if (planName === 'Starter' || planName === 'Enterprise') return baseDuration;
    return isYearly ? '/ month, billed annually' : baseDuration;
  };

  if (loadingTier) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Manage Subscription View for Pro/Max users
  if ((currentTier === 'pro' || currentTier === 'max') && !showPlans) {
    const activePlan = plans.find(p => p.name.toLowerCase() === currentTier);
    const tierConfig = TIER_CONFIG[currentTier as TierName];
    const isMax = currentTier === 'max';

    const usageMeters = [
      { label: 'Roadmaps Saved', icon: Layers, used: 0, limit: tierConfig.maxRoadmaps, unlimited: tierConfig.maxRoadmaps >= 100 },
      { label: 'Roadmaps Generated', icon: BookOpen, used: 0, limit: tierConfig.roadmapsPerMonth, unlimited: false, suffix: '/ mo' },
      { label: 'Resume Parses', icon: FileText, used: 0, limit: tierConfig.resumeParsesPerDay, unlimited: false, suffix: '/ day' },
      { label: 'Mock Interviews', icon: Mic, used: 0, limit: tierConfig.interviewsPerMonth, unlimited: tierConfig.interviewsPerMonth >= 9999, suffix: '/ mo' },
      { label: 'Scenarios', icon: TerminalIcon, used: 0, limit: tierConfig.scenariosPerMonth, unlimited: tierConfig.scenariosPerMonth >= 9999, suffix: '/ mo' },
      { label: 'Mentorship Msgs', icon: MessageSquare, used: 0, limit: tierConfig.mentorshipMsgsPerHour, unlimited: tierConfig.mentorshipMsgsPerHour >= 999, suffix: '/ hr' },
    ];

    return (
      <div className="px-6 py-10 md:px-10 lg:px-16 min-h-[calc(100vh-4rem)] flex flex-col items-center relative">
        {/* Multiple ambient orbs */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div 
            className="absolute top-[-10%] left-[20%] h-[35rem] w-[35rem] bg-primary/10 blur-[150px] rounded-full"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            className="absolute bottom-[-10%] right-[10%] h-[25rem] w-[25rem] bg-primary/8 blur-[120px] rounded-full"
            animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          className="w-full max-w-5xl mx-auto relative z-10"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="mb-10 text-center">
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2 text-sm font-bold text-primary mb-6"
              animate={{ boxShadow: ['0 0 20px rgba(20,184,166,0.1)', '0 0 40px rgba(20,184,166,0.3)', '0 0 20px rgba(20,184,166,0.1)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Crown className="h-4 w-4" /> {isMax ? 'Maximum Power' : 'Pro Member'}
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Your <span className="text-primary">Subscription</span>
            </h1>
            <p className="text-muted-foreground">
              You're on the {tierConfig.label} plan. Here's everything at your fingertips.
            </p>
          </motion.div>

          {/* Main Layout Area (No Box) */}
          <motion.div variants={staggerItem} className="flex flex-col gap-12 w-full mt-10">
            
            {/* Top section - Plan info */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Active Plan</p>
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight">
                        {tierConfig.label}
                      </h2>
                      <motion.span 
                        className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-sm font-bold text-emerald-400"
                        animate={{ boxShadow: ['0 0 10px rgba(16,185,129,0.1)', '0 0 25px rgba(16,185,129,0.3)', '0 0 10px rgba(16,185,129,0.1)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Active
                      </motion.span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-3xl font-black text-foreground">{activePlan?.price}<span className="text-base font-medium text-muted-foreground"> {activePlan?.duration}</span></p>
                    </div>
                    <motion.div 
                      className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-xl shadow-primary/20"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {isMax ? <Crown className="h-8 w-8 text-white" /> : <Zap className="h-8 w-8 text-white" />}
                    </motion.div>
                  </div>
                </div>
            </div>

            {/* Billing info strip */}
            <div className="py-6 md:py-8 border-y border-border/30 flex flex-wrap items-center gap-x-16 gap-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Billing</p>
                    <p className="text-sm font-bold text-foreground">Monthly</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Renewal</p>
                    <p className="text-sm font-bold text-foreground">Manual</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                    <p className="text-sm font-bold text-emerald-400">Secured</p>
                  </div>
                </div>
              </div>

            {/* Usage Meters */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">Plan Limits & Usage</h3>
              </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {usageMeters.map((meter, idx) => (
                    <motion.div 
                      key={idx}
                      className="rounded-xl border border-border/50 bg-muted/20 p-5 hover:border-primary/30 transition-colors group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <meter.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-bold text-foreground">{meter.label}</span>
                        </div>
                      </div>
                      {meter.unlimited ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-primary/20 overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.5, delay: idx * 0.1 }}
                            />
                          </div>
                          <span className="text-xs font-bold text-primary">∞</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div 
                                className="h-full bg-primary rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min((meter.used / meter.limit) * 100, 100)}%` }}
                                transition={{ duration: 1, delay: idx * 0.1 }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-bold text-foreground">{meter.used}</span> / {meter.limit} {meter.suffix || ''}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 pb-12 flex flex-col sm:flex-row gap-6">
                <Button 
                  onClick={() => setShowPlans(true)}
                  className="flex-1 rounded-xl py-6 font-bold gap-2 hover:scale-[1.02] transition-transform"
                >
                  Change Plan <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => toast.info('To cancel or manage billing details, please contact support.')}
                  className="flex-1 rounded-xl py-6 font-bold hover:bg-muted"
                >
                  Manage Billing
                </Button>
              </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="px-8 py-12 md:px-10 lg:px-16 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-7xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Scale your <span className="text-primary">Career Engine.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your ambition. From exploring the graph to dominating your industry.
          </p>

          {(currentTier === 'pro' || currentTier === 'max') && showPlans && (
            <Button variant="ghost" className="mt-4" onClick={() => setShowPlans(false)}>
              &larr; Back to Subscription Management
            </Button>
          )}

          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-muted border border-border transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <span 
                className={`inline-block h-5 w-5 transform rounded-full bg-primary transition-transform shadow-md ${isYearly ? 'translate-x-7' : 'translate-x-1'}`} 
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Annually</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">Save 20%</span>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <DashboardPricingCard key={plan.name} plan={plan} isYearly={isYearly} getPrice={getPrice} getDuration={getDuration} />
          ))}
        </div>
      </motion.div>
    </div>
    </>
  );
}
