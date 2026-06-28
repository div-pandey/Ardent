import { createClient } from '@/lib/supabase/server';
import { Award, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function VerifyCertificatePage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, profiles(full_name)')
    .eq('unique_code', code)
    .eq('status', 'issued')
    .single();

  const isValid = !!cert;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2">
        <Award className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl tracking-tight">Ardent</span>
      </Link>

      <div className="relative z-10 max-w-lg w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl text-center">
        {isValid ? (
          <>
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            
            <h1 className="text-3xl font-black mb-2 tracking-tight">Verified Certificate</h1>
            <p className="text-muted-foreground mb-8">
              This confirms the authenticity of the completion certificate issued by Ardent.
            </p>

            <div className="bg-background rounded-2xl border border-border p-6 text-left space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recipient</p>
                <p className="font-bold text-lg">{cert.recipient_name}</p>
              </div>
              <div className="h-px w-full bg-border" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Roadmap Completed</p>
                <p className="font-semibold text-primary">{cert.roadmap_title}</p>
              </div>
              <div className="h-px w-full bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Issue Date</p>
                  <p className="font-medium">{new Date(cert.issued_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 text-right">Verification Code</p>
                  <p className="font-mono font-bold text-emerald-400">{cert.unique_code}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            
            <h1 className="text-3xl font-black mb-2 tracking-tight">Invalid Certificate</h1>
            <p className="text-muted-foreground">
              We could not find a valid issued certificate matching the code <span className="font-mono text-foreground font-bold">{code}</span>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
