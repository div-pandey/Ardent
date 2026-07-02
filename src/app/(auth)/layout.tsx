'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — Orbital Animation */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        {/* Deep space/clean background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* Ambient teal glows */}
        <motion.div
          className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full blur-[80px] opacity-20"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* SVG Orbital Animation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
          <svg viewBox="0 0 800 800" className="w-[120%] h-[120%] min-w-[800px] min-h-[800px]" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="orbit-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="orbit-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Orbit 1 */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '400px', originY: '400px' }}
            >
              <circle cx="400" cy="400" r="320" fill="none" stroke="url(#orbit-grad-1)" strokeWidth="1" strokeDasharray="4 12" />
              <circle cx="720" cy="400" r="3" fill="#14b8a6" />
            </motion.g>

            {/* Orbit 2 */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '400px', originY: '400px' }}
            >
              <circle cx="400" cy="400" r="240" fill="none" stroke="url(#orbit-grad-2)" strokeWidth="2" strokeDasharray="300 200 100 50" />
              <circle cx="400" cy="160" r="4" fill="#0ea5e9" className="drop-shadow-[0_0_10px_#0ea5e9]" />
            </motion.g>

            {/* Orbit 3 */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '400px', originY: '400px' }}
            >
              <circle cx="400" cy="400" r="160" fill="none" stroke="#14b8a6" strokeWidth="0.5" strokeOpacity="0.4" />
              <path d="M 400 240 L 538 480 L 262 480 Z" fill="none" stroke="url(#orbit-grad-1)" strokeWidth="0.5" strokeOpacity="0.3" />
              <path d="M 400 560 L 262 320 L 538 320 Z" fill="none" stroke="url(#orbit-grad-2)" strokeWidth="0.5" strokeOpacity="0.3" />
            </motion.g>

            {/* Center Core */}
            <circle cx="400" cy="400" r="40" fill="none" stroke="#14b8a6" strokeWidth="1" strokeOpacity="0.2" />
            <motion.circle 
              cx="400" cy="400" r="30" 
              fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeOpacity="0.5" strokeDasharray="2 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '400px', originY: '400px' }}
            />
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full">
          <motion.div 
            className="max-w-[420px] text-center"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mb-8 flex items-center justify-center">
              <img src="/favicon.ico" alt="Ardent Logo" className="h-14 w-14 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
              Every career <br/> has a path.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Ardent maps the invisible connections between your skills, your goals, and the exact steps in between.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel — Form (theme-aware) */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 bg-background z-20">
        {/* Subtle accent glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsla(173,80%,40%,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,hsla(173,80%,40%,0.08)_0%,transparent_50%)]" />
        
        {/* Divider glow line (desktop only) */}
        <div className="pointer-events-none absolute left-0 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent shadow-[0_0_12px_hsla(173,80%,40%,0.3)] hidden lg:block" />
        
        {/* Glassmorphic form container — the "box effect" */}
        <div className="relative z-10 w-full max-w-[420px] rounded-3xl sm:border sm:border-border sm:bg-card/80 sm:p-10 sm:shadow-2xl sm:backdrop-blur-xl dark:sm:bg-card/60 dark:sm:border-border/50">
          {/* Inner glow border */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl hidden sm:block">
            <div className="absolute inset-0 rounded-3xl opacity-40 dark:opacity-60" style={{ 
              background: 'linear-gradient(135deg, hsla(173,80%,40%,0.1) 0%, transparent 40%, transparent 60%, hsla(173,80%,40%,0.05) 100%)' 
            }} />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
