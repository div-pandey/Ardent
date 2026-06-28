'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Network,
  Route,
  BookOpen,
  BarChart3,
  Target,
  Users,
  Terminal,
  FileText,
  Briefcase,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/layout/bottom-nav';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Career Graph', href: '/graph', icon: Network },
  { label: 'Adaptive Roadmap', href: '/roadmap', icon: Route },
  { label: 'Daily Challenges', href: '/challenges', icon: Target },
  { label: 'Mock Interviews', href: '/interviews', icon: Users },
  { label: 'Day in the Life', href: '/scenarios', icon: Terminal },
  { label: 'Ardent Guide', href: '/guide', icon: BookOpen },
  { label: 'Progress', href: '/progress', icon: BarChart3 },
];

const secondaryItems = [
  { label: 'Resume', href: '/resume', icon: FileText },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile */}
      <motion.aside
        className="relative z-20 hidden flex-col border-r border-sidebar-border bg-sidebar md:flex"
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo (Now acts as Collapse Toggle) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-14 w-full items-center gap-2 px-4 transition-colors hover:bg-surface-2 focus:outline-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-base font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                Ardent
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <Separator className="bg-sidebar-border" />

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-lg px-3 py-2 text-[15px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-surface-2 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 h-5 w-1 rounded-r-full bg-primary"
                    layoutId="sidebar-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            if (collapsed) {
              return (
                <span key={item.href} className="t-tt-wrap w-full flex">
                  <div className="w-full relative">{linkContent}</div>
                  <span className="t-tt" role="tooltip" style={{ left: '100%', top: '50%', transform: 'translate(10px, -50%)', bottom: 'auto' }}>
                    {item.label}
                  </span>
                </span>
              );
            }
            return <div key={item.href} className="relative">{linkContent}</div>;
          })}

          <Separator className="!my-6 bg-sidebar-border" />

          {secondaryItems.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-lg px-3 py-2 text-[15px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-surface-2 hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );

            if (collapsed) {
              return (
                <span key={item.href} className="t-tt-wrap w-full flex">
                  <div className="w-full">{linkContent}</div>
                  <span className="t-tt" role="tooltip" style={{ left: '100%', top: '50%', transform: 'translate(10px, -50%)', bottom: 'auto' }}>
                    {item.label}
                  </span>
                </span>
              );
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Bottom Section */}
        <div className="space-y-2 border-t border-sidebar-border px-3 py-6">
          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              'group flex items-center gap-4 rounded-lg px-3 py-2 text-[15px] font-medium transition-all duration-200',
              pathname === '/settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <Settings className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* Upgrade Button */}
          <Link
            href="/plans"
            className={cn(
              'group flex items-center gap-4 rounded-lg px-3 py-2 text-[15px] font-bold transition-all duration-200',
              'bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]'
            )}
          >
            {collapsed ? (
              <Zap className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <Zap className="h-5 w-5 shrink-0 fill-primary group-hover:fill-white transition-colors" />
                <span>Upgrade</span>
              </>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
