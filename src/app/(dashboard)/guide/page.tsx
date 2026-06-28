'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Send, Sparkles, Zap, Target, BookOpen, Heart, FileText,
  User, Plus, MessageSquare, PanelLeftClose, PanelLeft, Info, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const quickActions = [
  { label: 'What should I learn next?', icon: Zap },
  { label: 'Explain my career path', icon: Target },
  { label: 'Review my progress', icon: BookOpen },
  { label: 'Help with resume', icon: FileText },
  { label: 'Motivate me', icon: Heart },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome', role: 'assistant',
  content: `Hey there! 👋 I'm the **Ardent Guide** — your AI career strategist.

I have access to your Career Intelligence Graph, including your skills, your target role, and your current roadmap progress. That means I won't give you generic advice — everything I suggest is tailored to **your** specific career situation.

Here are some things I can help you with:
- 🎯 **Career Path Strategy** — Why a specific route makes sense for you
- 📊 **Progress Analysis** — Where you are and what to focus on next
- 📝 **Resume Optimization** — What to highlight based on your skill graph
- 💡 **Skill Prioritization** — The highest-impact skills to learn right now
- 🧠 **Interview Prep** — Practice questions for your target role

What would you like to explore?`,
  timestamp: new Date().toISOString(),
};

export default function GuidePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`ardent_guide_conversations_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          setConversations(parsed);
          setCurrentChatId(parsed[0].id);
          setMessages(parsed[0].messages || [WELCOME_MESSAGE]);
          return;
        }
      } catch (e) {
        console.error("Failed to parse conversations", e);
      }
    }
    
    // Default for new user or empty state
    const newId = Date.now().toString();
    const newChat = { id: newId, title: 'New conversation', date: 'Now', messages: [WELCOME_MESSAGE] };
    setConversations([newChat]);
    setCurrentChatId(newId);
    setMessages([WELCOME_MESSAGE]);
  }, [userId]);

  function saveConversations(updatedMessages: Message[], isAssistantResponse = false) {
    if (!userId || !currentChatId) return;
    
    setConversations(prev => {
      let newTitle = prev.find(c => c.id === currentChatId)?.title || 'New conversation';
      if (!isAssistantResponse && updatedMessages.length === 2) {
        const firstUserMsg = updatedMessages[1].content;
        newTitle = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '');
      }

      const updatedConvos = prev.map(c => 
        c.id === currentChatId 
          ? { ...c, title: newTitle, messages: updatedMessages, date: 'Today' } 
          : c
      );
      localStorage.setItem(`ardent_guide_conversations_${userId}`, JSON.stringify(updatedConvos));
      return updatedConvos;
    });
  }

  function handleNewConversation() {
    if (!userId) return;
    const newId = Date.now().toString();
    const newChat = { id: newId, title: 'New conversation', date: 'Now', messages: [WELCOME_MESSAGE] };
    setConversations(prev => {
      const updated = [newChat, ...prev];
      localStorage.setItem(`ardent_guide_conversations_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setCurrentChatId(newId);
    setMessages([WELCOME_MESSAGE]);
  }

  function loadConversation(id: string) {
    const chat = conversations.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
    }
  }

  function deleteConversation(id: string) {
    if (!userId) return;
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      
      if (id === currentChatId) {
        if (updated.length > 0) {
          setCurrentChatId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          const newId = Date.now().toString();
          const newChat = { id: newId, title: 'New conversation', date: 'Now', messages: [WELCOME_MESSAGE] };
          setCurrentChatId(newId);
          setMessages([WELCOME_MESSAGE]);
          updated.push(newChat);
        }
      }
      
      localStorage.setItem(`ardent_guide_conversations_${userId}`, JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  async function handleSend(content?: string) {
    const text = content || input.trim();
    if (!text) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, newUserMessage];
    
    setMessages(updatedMessages);
    saveConversations(updatedMessages, false);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const json = await res.json();
      
      if (json.data !== undefined) {
        const finalContent = json.data || "I'm sorry, I couldn't generate a response. Please try again.";
        const finalMessages = [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: finalContent, timestamp: new Date().toISOString() }];
        setMessages(finalMessages);
        saveConversations(finalMessages, true);
      } else if (json.error) {
        const finalMessages = [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: `⚠️ **Error:** ${json.error}`, timestamp: new Date().toISOString() }];
        setMessages(finalMessages);
        saveConversations(finalMessages, true);
      }
    } catch (e) {
      console.error(e);
      const finalMessages = [...updatedMessages, { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date().toISOString() }];
      setMessages(finalMessages);
      saveConversations(finalMessages, true);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="hidden flex-col border-r border-border bg-sidebar md:flex"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewConversation}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <Separator className="bg-border" />
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">

              {conversations.map((c) => (
                <div key={c.id} className="group relative flex items-center">
                  <button onClick={() => loadConversation(c.id)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${c.id === currentChatId ? 'bg-accent' : 'hover:bg-muted/50'}`}>
                    <MessageSquare className={`h-4 w-4 shrink-0 ${c.id === currentChatId ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0 flex-1 pr-6">
                      <p className={`truncate text-sm ${c.id === currentChatId ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.date} · {c.messages.length} msgs</p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    className={`absolute right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 ${c.id === currentChatId ? 'opacity-100 text-muted-foreground hover:text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6 bg-background">
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 md:inline-flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">Ardent Guide</h1>
            <p className="text-[10px] text-muted-foreground">AI Career Strategist · Powered by Sarvam AI</p>
          </div>
          <div className="hidden items-center gap-2 glass-label sm:flex">
            <Info className="h-3 w-3" />
            <span className="text-[10px]">Has context: Skills · Path · Roadmap</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarFallback className={m.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}>
                    {m.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                  m.role === 'assistant'
                    ? 'rounded-tl-sm bg-white/[0.03] border border-white/[0.06]'
                    : 'rounded-tr-sm bg-primary text-primary-foreground'
                }`}>
                  {m.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted border border-border px-4 py-3">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background px-4 py-3 md:px-6 md:py-4">
          <div className="mx-auto max-w-3xl">
            {messages.length <= 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickActions.map((a) => (
                  <button key={a.label} onClick={() => handleSend(a.label)}
                    className="glass-label text-xs hover:bg-primary/8 transition-colors cursor-pointer">
                    <a.icon className="h-3 w-3" />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Textarea id="guide-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask your career strategist..." className="min-h-[44px] max-h-32 resize-none bg-muted/50 border-border" rows={1} />
              <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="h-11 w-11 shrink-0 rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
