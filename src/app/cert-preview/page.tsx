'use client';

import { CertificateModal } from '@/components/shared/certificate-modal';

export default function CertPreviewPage() {
  return (
    <div className="h-screen w-full bg-background flex items-center justify-center p-8">
      {/* 
        This is a temporary page to preview the certificate.
        We pass dummy data and tier="pro" to bypass the lock screen.
      */}
      <CertificateModal 
        isOpen={true} 
        onClose={() => {}} 
        roadmapId="mock-123" 
        roadmapTitle="Full Stack Software Engineer"
        tier="pro"
      />
    </div>
  );
}
