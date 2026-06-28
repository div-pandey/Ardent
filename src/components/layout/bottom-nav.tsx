'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Compass, Swords, Map } from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Graph', href: '/graph', icon: Sparkles },
  { label: 'Roadmap', href: '/roadmap', icon: Map },
  { label: 'Challenges', href: '/challenges', icon: Swords },
  { label: 'Guide', href: '/guide', icon: Compass },
];

export function BottomNav() {
  const pathname = usePathname();

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
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
