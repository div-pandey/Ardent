'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Briefcase, Palette, Trash2, AlertTriangle, 
  Loader2, Bell, Link as LinkIcon, Shield, LogOut, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const TABS = [
  { id: 'general', label: 'General Profile', icon: User },
  { id: 'career', label: 'Career Goals', icon: Briefcase },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  { id: 'security', label: 'Security & Session', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Profile State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Career State
  const [currentRole, setCurrentRole] = useState('Frontend Developer');
  const [targetRole, setTargetRole] = useState('ML Engineer');
  const [isSavingCareer, setIsSavingCareer] = useState(false);

  // Notification State
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingNotif, setMarketingNotif] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setName(user.user_metadata?.full_name || '');
        
        // Fetch custom profile data including notification preferences
        const { data: profile } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single();
        if (profile?.notification_preferences) {
          const prefs = profile.notification_preferences as any;
          setEmailNotif(prefs.email ?? true);
          setPushNotif(prefs.push ?? true);
          setMarketingNotif(prefs.marketing ?? false);
        }
      }

      try {
        const res = await fetch('/api/progress');
        const json = await res.json();
        if (json.data) {
          setTargetRole(json.data.targetRole || 'ML Engineer');
        }
      } catch (e) {
        console.error('Failed to load roles');
      }
    }
    loadUserData();
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Account deleted successfully. Farewell!');
        setShowDeleteModal(false);
        router.push('/');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch (e) {
      toast.error('An error occurred while deleting account.');
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
    }
    setIsSavingProfile(false);
  };

  const handleSaveCareer = async () => {
    setIsSavingCareer(true);
    try {
      await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_roles', currentRole, targetRole }),
      });
      toast.success('Career goals updated successfully!');
    } catch (e) {
      toast.error('Failed to update career goals.');
    } finally {
      setIsSavingCareer(false);
    }
  };

  const handleTogglePreference = async (key: 'email' | 'push' | 'marketing', value: boolean) => {
    // Optimistic UI update
    if (key === 'email') setEmailNotif(value);
    if (key === 'push') setPushNotif(value);
    if (key === 'marketing') setMarketingNotif(value);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Construct the new JSON object
    const newPrefs = {
      email: key === 'email' ? value : emailNotif,
      push: key === 'push' ? value : pushNotif,
      marketing: key === 'marketing' ? value : marketingNotif
    };

    const { error } = await supabase.from('profiles').update({ notification_preferences: newPrefs }).eq('id', user.id);
    if (error) {
      toast.error('Failed to save preference');
      // Simple revert on error
      if (key === 'email') setEmailNotif(!value);
      if (key === 'push') setPushNotif(!value);
      if (key === 'marketing') setMarketingNotif(!value);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-full md:w-64 shrink-0 border-r border-border bg-card/30 flex flex-col">
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">General Profile</h2>
                    <p className="text-sm text-muted-foreground">Update your personal information and bio.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="settings-name">Full Name</Label>
                        <Input id="settings-name" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="settings-email">Email Address</Label>
                        <Input id="settings-email" value={email} disabled className="opacity-50 cursor-not-allowed bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="settings-bio">Bio</Label>
                      <Input id="settings-bio" placeholder="Tell us about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Brief description for your profile. URLs are hyperlinked.</p>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'career' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Career Goals</h2>
                    <p className="text-sm text-muted-foreground">Changing your target role will dynamically rebuild your learning roadmap.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="settings-current-role">Current Role</Label>
                      <Input id="settings-current-role" value={currentRole} onChange={e => setCurrentRole(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Where you are starting from.</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="settings-target-role">Target Role</Label>
                      <Input id="settings-target-role" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                      <p className="text-xs text-muted-foreground">The position you are transitioning into.</p>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button onClick={handleSaveCareer} disabled={isSavingCareer}>
                        {isSavingCareer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Career Goals
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Appearance</h2>
                    <p className="text-sm text-muted-foreground">Customize how Ardent looks on your device.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Interface Theme</Label>
                        <p className="text-sm text-muted-foreground">Select or customize your UI theme.</p>
                      </div>
                      {mounted && (
                        <div className="flex items-center rounded-lg border border-border p-1 bg-background/50">
                          <button
                            onClick={() => setTheme('dark')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                              theme === 'dark' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-foreground/5'
                            }`}
                          >
                            Dark
                          </button>
                          <button
                            onClick={() => setTheme('light')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                              theme === 'light' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-foreground/5'
                            }`}
                          >
                            Light
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-sm text-muted-foreground">Choose what updates you want to receive.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border/50">
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive daily challenge reminders and weekly recaps.</p>
                      </div>
                      <Switch checked={emailNotif} onCheckedChange={(v) => handleTogglePreference('email', v)} />
                    </div>
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <Label>In-App Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get notified when AI processing is complete.</p>
                      </div>
                      <Switch checked={pushNotif} onCheckedChange={(v) => handleTogglePreference('push', v)} />
                    </div>
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <Label>Marketing & Offers</Label>
                        <p className="text-sm text-muted-foreground">Receive emails about new features and premium tier offers.</p>
                      </div>
                      <Switch checked={marketingNotif} onCheckedChange={(v) => handleTogglePreference('marketing', v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Integrations</h2>
                    <p className="text-sm text-muted-foreground">Connect third-party accounts to Ardent.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                           {/* Simple github icon placeholder */}
                           <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        </div>
                        <div>
                          <p className="font-semibold">GitHub</p>
                          <p className="text-sm text-muted-foreground">Import projects and analyze your commit history.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Security & Session</h2>
                    <p className="text-sm text-muted-foreground">Manage your active sessions and account status.</p>
                  </div>
                  
                  <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Current Session
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">You are securely logged in on this device.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.push('/login');
                        router.refresh();
                      }}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </div>

                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                    <div>
                      <p className="font-semibold text-destructive flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Danger Zone
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="mt-6"
                      onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md p-4"
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-zinc-950 shadow-2xl">
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Delete Account</h2>
                  <div className="mt-4 space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      This action is <span className="font-semibold text-foreground">permanent and irreversible</span>. 
                      Your entire profile and all associated data will be completely erased.
                    </p>
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-semibold text-destructive flex items-center gap-2 mb-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-[10px] font-black">!</span>
                        You will permanently lose:
                      </p>
                      <ul className="space-y-2 ml-7 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-destructive/60 shrink-0" />
                          Your Career Intelligence Graph
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-destructive/60 shrink-0" />
                          AI-generated learning roadmaps
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-destructive/60 shrink-0" />
                          All skill progress & resumes
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
                        Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                      </Label>
                      <div className={`t-input-wrap ${deleteConfirmText && deleteConfirmText !== 'DELETE' ? 'is-error' : ''}`}>
                        <div className={`t-input ${deleteConfirmText && deleteConfirmText !== 'DELETE' ? 'is-error is-shaking' : ''}`}>
                          <Input
                            id="delete-confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE here"
                            className="font-mono border-destructive/20 focus:border-destructive focus:ring-destructive/20 bg-background"
                            autoComplete="off"
                            disabled={isDeleting}
                          />
                        </div>
                        <p className="t-error-msg text-xs text-destructive mt-1.5" role="alert">
                          Must type exactly "DELETE"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                  <Button 
                    variant="ghost" 
                    className="w-full sm:w-auto" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="w-full sm:w-auto gap-2"
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 className="h-4 w-4" /> Delete Everything</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
