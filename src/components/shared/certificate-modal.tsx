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
  const certRef = useRef<HTMLDivElement>(null);

  const isFree = tier === 'free';

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
                <div 
                  ref={certRef}
                  className="relative w-full aspect-[1.414/1] bg-white text-slate-900 p-6 flex flex-col items-center justify-center overflow-hidden border-[16px] border-slate-50"
                >
                  {/* Background Accents */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
                  
                  {/* Inner Border */}
                  <div className="absolute inset-4 border border-slate-200 pointer-events-none z-10" />
                  <div className="absolute inset-5 border-2 border-emerald-500/20 pointer-events-none z-10" />
                  
                  {/* Corner Ornaments */}
                  <div className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2 border-emerald-500/40 z-10" />
                  <div className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-emerald-500/40 z-10" />
                  <div className="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2 border-emerald-500/40 z-10" />
                  <div className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 border-emerald-500/40 z-10" />

                  {/* Main Content Container */}
                  <div className="flex flex-col items-center justify-between w-full h-full z-20 relative p-6 md:p-8">
                    
                    {/* Verification Tag */}
                    {(status === 'issued' || uniqueCode) && (
                      <div className="absolute top-0 md:top-2 left-1/2 -translate-x-1/2 w-full text-center z-20">
                        <span className="text-[7px] md:text-[8px] text-slate-400 font-mono tracking-widest">
                          Verify: ardent.com/verify/{uniqueCode || 'MOCK-CERT-123'}
                        </span>
                      </div>
                    )}

                    {/* Top */}
                    <div className="flex flex-col items-center w-full mt-4 md:mt-6">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <Award className="h-6 md:h-8 w-6 md:w-8 text-emerald-600" />
                        <span className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase text-slate-800">Ardent</span>
                      </div>
                      <h1 className="text-[9px] md:text-[11px] uppercase tracking-[0.4em] text-slate-500 font-semibold">Certificate of Completion</h1>
                    </div>

                    {/* Middle */}
                    <div className="flex flex-col items-center justify-center flex-1 w-full my-1 md:my-3">
                      <p className="text-[10px] md:text-sm text-slate-500 mb-1 md:mb-2 italic">
                        This proudly certifies that
                      </p>
                      <h2 className="text-3xl md:text-5xl font-black mb-1 md:mb-3 text-center text-slate-900 tracking-tight leading-tight max-w-[90%] font-serif">
                        {recipientName || 'Your Name'}
                      </h2>
                      <p className="text-[10px] md:text-xs text-slate-600 mb-1 md:mb-1.5 text-center max-w-lg leading-relaxed px-4">
                        has successfully completed the comprehensive career roadmap and demonstrated proficiency in
                      </p>
                      <h3 className="text-lg md:text-2xl font-bold text-emerald-600 text-center">
                        {roadmapTitle}
                      </h3>
                    </div>

                    {/* Bottom */}
                    <div className="w-full flex justify-between items-end px-2 md:px-8 mt-auto pb-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] md:text-sm font-bold text-slate-700 mb-1">
                          {issuedAt 
                            ? new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="h-px w-20 md:w-32 bg-slate-400 mb-1.5 md:mb-2" />
                        <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Date Issued</span>
                      </div>
                      
                      <div className="flex flex-col items-center relative">
                        {/* Signature */}
                        <span className="font-['Brush_Script_MT',cursive] text-2xl md:text-4xl text-emerald-700 absolute -top-2 md:-top-4 rotate-[-5deg]">Divyansh</span>
                        <span className="text-[10px] md:text-sm text-transparent mb-1">Divyansh</span>
                        <div className="h-px w-20 md:w-32 bg-slate-400 mb-1.5 md:mb-2" />
                        <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Founder & CEO</span>
                      </div>
                    </div>
                  </div>
                </div>

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
