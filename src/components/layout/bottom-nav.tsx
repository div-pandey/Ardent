'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Compass, Swords, Map, Menu, Users, Terminal, BarChart3, FileText, Briefcase, Settings, Zap } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Graph', href: '/graph', icon: Sparkles },
  { label: 'Roadmap', href: '/roadmap', icon: Map },
  { label: 'Challenges', href: '/challenges', icon: Swords },
];

const MORE_ITEMS = [
  { label: 'Guide', href: '/guide', icon: Compass },
  { label: 'Interviews', href: '/interviews', icon: Users },
  { label: 'Scenarios', href: '/scenarios', icon: Terminal },
  { label: 'Progress', href: '/progress', icon: BarChart3 },
  { label: 'Resume', href: '/resume', icon: FileText },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.04] bg-background/90 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_6px_hsla(262,83%,58%,0.5)]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-sidebar/95 backdrop-blur-xl border-t border-sidebar-border overflow-y-auto pt-6 px-4 pb-12">
            <SheetHeader className="mb-6 px-2 text-left">
              <SheetTitle className="text-xl font-bold tracking-tight">Explore Ardent</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1.5">
              {MORE_ITEMS.map(item => {
                const active = pathname === item.href;
                return (
                 <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-surface-2'}`}>
                   <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                   <span className="font-semibold text-[15px]">{item.label}</span>
                 </Link>
                )
              })}
              
              <div className="my-4 h-[1px] w-full bg-sidebar-border/50" />
              
              <Link href="/plans" onClick={() => setOpen(false)} className="group flex items-center gap-4 rounded-xl bg-primary/10 px-4 py-4 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <Zap className="h-5 w-5 fill-primary group-hover:fill-white transition-colors" />
                <span className="font-bold text-[15px]">Upgrade Plan</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
