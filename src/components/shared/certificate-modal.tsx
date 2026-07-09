'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapId: string;
  roadmapTitle: string;
  tier: string;
}

export function CertificateModal({ isOpen, onClose, roadmapId, roadmapTitle, tier }: CertificateModalProps) {
  const [recipientName, setRecipientName] = useState('');
  const [status, setStatus] = useState<'loading' | 'draft' | 'issued'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [isScreenshotAttempt, setIsScreenshotAttempt] = useState(false);
  const [clipboardAllowed, setClipboardAllowed] = useState<boolean | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const isFree = tier === 'free';

  // Advanced Anti-Screenshot Measures
  useEffect(() => {
    if (status === 'issued' || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        setIsScreenshotAttempt(true);
        navigator.clipboard.writeText("screenshot is prohibited for unverified certificates");
        toast.error("Screenshot Detected", { description: "Capturing unverified certificates is prohibited." });
        
        setTimeout(() => setIsScreenshotAttempt(false), 3000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        navigator.clipboard.writeText("screenshot is prohibited for unverified certificates");
      }
    };

    const handleBlur = () => {
      // Obscure when window loses focus (Snipping tool activation)
      setIsScreenshotAttempt(true);
    };

    const handleFocus = () => {
      setIsScreenshotAttempt(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadCertificate();
    }
  }, [isOpen]);

  async function loadCertificate() {
    setStatus('loading');
    try {
      if (roadmapId === 'mock-123') {
        // Preview mode
        setTimeout(() => {
          setRecipientName('Divyansh');
          setStatus('draft');
          setUniqueCode('MOCK-CERT-123');
          setIssuedAt('');
        }, 500);
        return;
      }

      // Always create/get draft
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId, roadmapTitle, action: 'draft' }),
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.certificate) {
        setRecipientName(data.certificate.recipient_name || '');
        setStatus(data.certificate.status);
        setUniqueCode(data.certificate.unique_code);
        setIssuedAt(data.certificate.issued_at);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load certificate data');
      onClose();
    }
  }

  async function handleIssueAndDownload() {
    if (isFree) {
      toast.error('Certificates are only available on Pro or Max plans.');
      return;
    }
    if (!recipientName.trim()) {
      toast.error('Please enter your name for the certificate.');
      return;
    }

    setIsProcessing(true);
    try {
      if (status !== 'issued') {
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadmapId, roadmapTitle, recipientName, action: 'issue' }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setStatus('issued');
        setUniqueCode(data.certificate.unique_code);
        setIssuedAt(data.certificate.issued_at);
      }

      // Allow state to settle for render
      setTimeout(() => downloadPDF(), 500);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate certificate');
      setIsProcessing(false);
    }
  }

  async function downloadPDF() {
    if (!certRef.current) return;
    
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        backgroundColor: '#0a0a0b',
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 3, canvas.height / 3]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 3, canvas.height / 3);
      pdf.save(`Ardent_Certificate_${roadmapTitle.replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Certificate downloaded successfully!');
    } catch (e) {
      toast.error('Failed to create PDF');
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => !isProcessing && onClose()}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Certificate of Completion
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Certificate Preview */}
          <div className="flex-1 w-full max-w-[800px] mx-auto shrink-0 relative rounded-xl overflow-hidden border border-border bg-background shadow-2xl isolate">
            {status === 'loading' ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {status === 'draft' && !clipboardAllowed ? (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-8 text-center border-2 border-dashed border-border rounded-xl m-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Clipboard Access Required</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      To prevent unauthorized distribution and screenshots, preview mode requires clipboard access.
                    </p>
                    <Button 
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText("Preview Access Granted");
                          setClipboardAllowed(true);
                        } catch (err) {
                          toast.error("Clipboard permission denied", { description: "Please allow clipboard access to view the preview." });
                        }
                      }}
                      className="px-8 font-bold"
                    >
                      Allow Access to View
                    </Button>
                  </div>
                ) : (
                  <div 
                    ref={certRef}
                    className={`relative w-full aspect-[1.414/1] bg-white text-slate-900 p-8 flex flex-col overflow-hidden border-[8px] border-slate-50 shadow-inner ${status !== 'issued' ? 'select-none pointer-events-none' : ''}`}
                  >
                  {/* Advanced Anti-Screenshot Blackout */}
                  {isScreenshotAttempt && (
                    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                      <Lock className="h-16 w-16 text-red-500 mb-4 animate-pulse" />
                      <p className="text-red-500 font-bold text-2xl tracking-widest uppercase">Screenshots Prohibited</p>
                    </div>
                  )}

                  {/* Anti-screenshot Watermark - Fixed Visibility */}
                  {status !== 'issued' && (
                    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-col items-center justify-center opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(0,0,0,0.05)_40px,rgba(0,0,0,0.05)_80px)]">
                      {/* Diagonal Text Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                        <div className="text-[60px] md:text-[80px] font-black tracking-[0.5em] whitespace-nowrap text-black/10 uppercase px-20">
                          PREVIEW SAMPLE
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Accents - Subtle wave pattern simulation */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-emerald-500/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_60s_linear_infinite] pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] border border-emerald-500/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
                  
                  {/* Inner Borders */}
                  <div className="absolute inset-4 border-[0.5px] border-slate-400/70 pointer-events-none z-10" />
                  <div className="absolute inset-[20px] border-[0.5px] border-slate-400/50 pointer-events-none z-10" />
                  <div className="absolute inset-[24px] border-[0.5px] border-slate-400/40 pointer-events-none z-10" />
                  
                  {/* Corner Ornaments */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-[2px] border-l-[2px] border-slate-500 z-10" />
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-[2px] border-r-[2px] border-slate-500 z-10" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-[2px] border-l-[2px] border-slate-500 z-10" />
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-[2px] border-r-[2px] border-slate-500 z-10" />

                  {/* Main Content Container - Strictly constrained within borders */}
                  <div className="absolute inset-[36px] flex flex-col z-20">
                    
                    {/* Header Row: Logos and Badges */}
                    <div className="flex justify-between items-start w-full">
                      {/* Left Logos */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="bg-emerald-500 rounded-full p-1 h-6 w-6 flex items-center justify-center">
                              <Award className="text-white h-4 w-4" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-800 uppercase font-sans">Ardent</span>
                          </div>
                          <div className="h-5 w-px bg-slate-300" />
                          <div className="flex items-center gap-1">
                            <span className="text-xl font-bold tracking-tight text-slate-800 uppercase italic font-sans text-emerald-700">Careers</span>
                          </div>
                        </div>
                        <span className="text-[7px] text-slate-500 mt-1 uppercase tracking-widest">Skill Up. Level Up.</span>
                      </div>

                      {/* Right Badges */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded flex items-center justify-center border border-slate-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 leading-none">Ardent for Education</span>
                            <span className="text-[9px] font-bold text-slate-700 leading-none mt-0.5">Partner</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full border border-emerald-500 flex items-center justify-center">
                            <Award className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 leading-none">ISO 9001-27001</span>
                            <span className="text-[9px] font-bold text-emerald-600 leading-none mt-0.5">CERTIFIED</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Content */}
                    <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0">
                      <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight font-sans mb-4 md:mb-6">
                        Certificate of Completion
                      </h1>

                      <h2 className={`text-2xl md:text-4xl font-semibold mb-3 md:mb-4 text-center text-slate-900 tracking-tight font-serif ${status !== 'issued' ? 'blur-[4px] select-none' : ''}`}>
                        {recipientName || 'Your Name'}
                      </h2>

                      <p className="text-[10px] md:text-sm text-slate-600 mb-3 md:mb-4 text-center max-w-2xl leading-relaxed px-4 font-serif italic">
                        is hereby awarded the certificate of achievement <br/> for the successful completion of
                      </p>

                      <h3 className="text-lg md:text-2xl font-bold text-slate-800 text-center uppercase tracking-widest font-sans">
                        {roadmapTitle}
                      </h3>
                    </div>

                    {/* Bottom Row */}
                    <div className="w-full grid grid-cols-3 items-end mt-auto pt-2">
                      {/* Left: Date */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] md:text-[10px] text-slate-500 mb-1">
                          Verify at: https://ardent.com/certificate?id={uniqueCode || 'MOCK-CERT-123'}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-slate-700">
                          Certificate issued on : 
                        </span>
                        <span className="text-[9px] md:text-[11px] font-semibold text-slate-800">
                          {issuedAt 
                            ? new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      
                      {/* Center: Signature */}
                      <div className="flex flex-col items-center relative">
                        <span className="font-['Brush_Script_MT',cursive] text-2xl md:text-4xl text-slate-800 absolute -top-3 md:-top-5 rotate-[-5deg] pointer-events-none">Divyansh</span>
                        <span className="text-[10px] md:text-sm text-transparent mb-1 select-none pointer-events-none">Divyansh</span>
                        <div className="h-px w-32 md:w-48 bg-slate-400 mb-1.5 md:mb-2" />
                        <span className="text-[10px] md:text-xs text-slate-800 font-bold">M. Divyansh</span>
                        <span className="text-[8px] md:text-[9px] text-slate-500 mt-0.5">Founder and CEO,</span>
                        <span className="text-[8px] md:text-[9px] text-slate-500">Ardent AI Networks.</span>
                      </div>

                      {/* Right: Verification */}
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] md:text-xs font-bold text-slate-700">
                          Valid certificate ID : 
                        </span>
                        <span className={`font-mono text-slate-800 font-bold text-[9px] md:text-[11px] ${status !== 'issued' ? 'blur-[3px] select-none' : ''}`}>
                          {uniqueCode || 'MOCK-CERT-123'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isFree && (
                  <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center text-center p-6">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold mb-2 text-white">Premium Certificate</h4>
                    <p className="text-sm text-white/80 max-w-xs mb-6">
                      Upgrade to Pro or Max to edit, generate, and download your verified completion certificate.
                    </p>
                    <Link href="/plans" onClick={onClose} className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/30">
                      View Plans
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Form Controls */}
          <div className="w-full md:w-64 space-y-6">
            <div>
              <h4 className="font-bold mb-1">Issue Details</h4>
              <p className="text-xs text-muted-foreground">This certificate validates your hard work and completion of all milestones.</p>
            </div>

            {status === 'issued' ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Certificate Issued
                </div>
                <p className="text-xs text-emerald-400/80 mb-4">
                  This certificate has been permanently issued and cannot be modified.
                </p>
                <Button 
                  className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white" 
                  onClick={downloadPDF}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
                <div className="mt-4 pt-3 border-t border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-1">Verification Code</p>
                  <p className="font-mono text-sm text-emerald-400 font-bold">{uniqueCode}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cert-name">Recipient Name</Label>
                  <div className="t-input-wrap">
                    <div className="t-input">
                      <Input 
                        id="cert-name"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        placeholder="Your full name"
                        disabled={isFree || isProcessing}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Make sure this matches your legal name for verification purposes.</p>
                </div>
                
                <Button 
                  className="w-full gap-2 transition-fast" 
                  onClick={handleIssueAndDownload}
                  disabled={isFree || isProcessing || !recipientName.trim() || status === 'loading'}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Generate & Download
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Once generated, the certificate is permanently issued and cannot be edited.
                </p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
