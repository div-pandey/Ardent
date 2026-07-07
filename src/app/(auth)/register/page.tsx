'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { signUp } from '@/actions/auth';

function getPasswordStrength(pw: string) {
  let score = 0;
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  if (checks.length) score++;
  if (checks.uppercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;

  const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-emerald-400', 'bg-emerald-400'];

  return { score, label: labels[score], color: colors[score], checks };
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (strength.score < 2) {
      errors.password = 'Password is too weak. Add uppercase letters or numbers.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('full_name', fullName.trim());

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result?.requireEmailVerification) {
      toast.success('Account created! Please check your email to verify your account.');
      router.push('/login');
    } else {
      toast.success('Account created! Redirecting to onboarding...');
      router.push('/onboarding');
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function handleGithubLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <img src="/favicon.ico" alt="Ardent Logo" className="h-9 w-9" />
        <span className="text-xl font-bold tracking-tight">Ardent</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start mapping your career in minutes.
      </p>

      {/* OAuth */}
      <div className="mt-6 grid gap-3">
        <Button id="google-register-btn" variant="outline" className="w-full h-11 gap-2 transition-fast" onClick={handleGoogleLogin} type="button">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-sm font-medium">Continue with Google</span>
        </Button>
        <Button id="github-register-btn" variant="outline" className="w-full h-11 gap-2 transition-fast" onClick={handleGithubLogin} type="button">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="text-sm font-medium">Continue with GitHub</span>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="register-name">Full Name</Label>
          <div className={`t-input-wrap ${fieldErrors.fullName ? 'is-error' : ''}`}>
            <div className={`t-input relative ${fieldErrors.fullName ? 'is-error' : ''}`}>
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
              <Input
                id="register-name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                className={`pl-9 h-11 relative z-0 ${fieldErrors.fullName ? 'border-destructive focus:ring-destructive/20' : ''}`}
                aria-invalid={!!fieldErrors.fullName}
                aria-describedby={fieldErrors.fullName ? 'register-name-error' : undefined}
                autoComplete="name"
                required
              />
            </div>
            <p id="register-name-error" className="t-error-msg text-xs text-destructive mt-1.5" role="alert">
              {fieldErrors.fullName || 'Error placeholder'}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email</Label>
          <div className={`t-input-wrap ${fieldErrors.email ? 'is-error' : ''}`}>
            <div className={`t-input relative ${fieldErrors.email ? 'is-error' : ''}`}>
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
              <Input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                className={`pl-9 h-11 relative z-0 ${fieldErrors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                autoComplete="email"
                required
              />
            </div>
            <p id="register-email-error" className="t-error-msg text-xs text-destructive mt-1.5" role="alert">
              {fieldErrors.email || 'Error placeholder'}
            </p>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className={`t-input-wrap ${fieldErrors.password ? 'is-error' : ''}`}>
            <div className={`t-input relative ${fieldErrors.password ? 'is-error' : ''}`}>
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { 
                  const val = e.target.value;
                  setPassword(val); 
                  clearFieldError('password');
                  if (confirmPassword && val !== confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
                  } else {
                    clearFieldError('confirmPassword');
                  }
                }}
                className={`pl-9 pr-9 h-11 relative z-0 ${fieldErrors.password ? 'border-destructive focus:ring-destructive/20' : ''}`}
                aria-invalid={!!fieldErrors.password}
                aria-describedby="password-strength register-password-error"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-fast z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <p id="register-password-error" className="t-error-msg text-xs text-destructive mt-1.5" role="alert">
              {fieldErrors.password || 'Error placeholder'}
            </p>
          </div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <motion.div
              id="password-strength"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 pt-1"
              role="status"
              aria-label={`Password strength: ${strength.label}`}
            >
              {/* Strength bar */}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        i < strength.score ? strength.color : 'bg-surface-3'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {strength.label}
                </span>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {[
                  { key: 'length', label: '8+ characters' },
                  { key: 'uppercase', label: 'Uppercase' },
                  { key: 'number', label: 'Number' },
                  { key: 'special', label: 'Special char' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5 text-[10px]">
                    {strength.checks[key as keyof typeof strength.checks] ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground/40" />
                    )}
                    <span
                      className={
                        strength.checks[key as keyof typeof strength.checks]
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/50'
                      }
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="register-confirm-password">Confirm Password</Label>
          <div className={`t-input-wrap ${fieldErrors.confirmPassword ? 'is-error' : ''}`}>
            <div className={`t-input relative ${fieldErrors.confirmPassword ? 'is-error' : ''}`}>
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
              <Input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => { 
                  const val = e.target.value;
                  setConfirmPassword(val); 
                  if (val && password && val !== password) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
                  } else {
                    clearFieldError('confirmPassword');
                  }
                }}
                className={`pl-9 h-11 relative z-0 ${fieldErrors.confirmPassword ? 'border-destructive focus:ring-destructive/20' : ''}`}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-error' : undefined}
                autoComplete="new-password"
                required
              />
            </div>
            <p id="register-confirm-error" className="t-error-msg text-xs text-destructive mt-1.5" role="alert">
              {fieldErrors.confirmPassword || 'Error placeholder'}
            </p>
          </div>
        </div>

        <Button
          id="register-submit-btn"
          type="submit"
          className="w-full h-11 transition-fast"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-[15px] text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors ml-1"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
