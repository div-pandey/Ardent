'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Briefcase,
  GraduationCap,
  FolderKanban,
  Code2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  Zap,
  Crown,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const TIER_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  free: { label: 'Free', icon: Zap, className: 'border-muted-foreground/30 text-muted-foreground' },
  pro: { label: 'Pro', icon: ShieldCheck, className: 'border-primary/40 text-primary' },
  max: { label: 'Max', icon: Crown, className: 'border-yellow-500/40 text-yellow-500' },
};

const STEPS = [
  { id: 'basic', label: 'Basic Details', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'preview', label: 'Preview & Export', icon: Eye },
];

export default function ResumeBuilderPage() {
  const [tier, setTier] = useState<string>('free');
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    basic: { 
      name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '',
      house: '', town: '', district: '', city: '', state: '', country: '', pin_code: '' 
    },
    summary: '',
    experience: [{ company: '', role: '', duration: '', description: '' }],
    projects: [{ title: '', tech_stack: '', link: '', description: '' }],
    education: [{ institution: '', degree: '', field: '', year: '', cgpa: '' }],
    skills: '',
  });

  useEffect(() => {
    async function fetchTier() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single();
        if (data) setTier(data.tier || 'free');
      }
    }
    fetchTier();
  }, []);

  const handleNext = () => {
    const newErrors: string[] = [];

    // Step 0: Basic
    if (currentStep === 0) {
      const required = ['name', 'email', 'phone', 'house', 'town', 'district', 'city', 'state', 'country', 'pin_code'];
      required.forEach(field => {
        if (!formData.basic[field as keyof typeof formData.basic]?.trim()) {
          newErrors.push(`basic.${field}`);
        }
      });
    }

    // Step 1: Summary
    if (currentStep === 1) {
      if (!formData.summary.trim()) newErrors.push('summary');
    }

    // Step 2: Experience
    if (currentStep === 2) {
      formData.experience.forEach((exp, i) => {
        if (!exp.company.trim()) newErrors.push(`exp.${i}.company`);
        if (!exp.role.trim()) newErrors.push(`exp.${i}.role`);
        if (!exp.duration.trim()) newErrors.push(`exp.${i}.duration`);
        if (!exp.description.trim()) newErrors.push(`exp.${i}.description`);
      });
    }

    // Step 3: Projects
    if (currentStep === 3) {
      formData.projects.forEach((proj, i) => {
        if (!proj.title.trim()) newErrors.push(`proj.${i}.title`);
        if (!proj.tech_stack.trim()) newErrors.push(`proj.${i}.tech_stack`);
        if (!proj.description.trim()) newErrors.push(`proj.${i}.description`);
      });
    }

    // Step 4: Education
    if (currentStep === 4) {
      formData.education.forEach((edu, i) => {
        if (!edu.institution.trim()) newErrors.push(`edu.${i}.institution`);
        if (!edu.degree.trim()) newErrors.push(`edu.${i}.degree`);
        if (!edu.field.trim()) newErrors.push(`edu.${i}.field`);
        if (!edu.year.trim()) newErrors.push(`edu.${i}.year`);
        if (!edu.cgpa.trim()) newErrors.push(`edu.${i}.cgpa`);
      });
    }

    // Step 5: Skills
    if (currentStep === 5) {
      if (!formData.skills.trim()) newErrors.push('skills');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all highlighted mandatory fields.');
      return;
    }

    setErrors([]);
    setCurrentStep((p) => Math.min(STEPS.length - 1, p + 1));
  };

  const handlePrev = () => {
    setErrors([]);
    setCurrentStep((p) => Math.max(0, p - 1));
  };

  const updateBasic = (field: string, value: string) => {
    setErrors(prev => prev.filter(e => e !== `basic.${field}`));
    setFormData(prev => ({ ...prev, basic: { ...prev.basic, [field]: value } }));
  };

  const updateArray = (section: 'experience' | 'projects' | 'education', index: number, field: string, value: string) => {
    const sectionPrefix = section === 'experience' ? 'exp' : section === 'projects' ? 'proj' : 'edu';
    setErrors(prev => prev.filter(e => e !== `${sectionPrefix}.${index}.${field}`));
    setFormData(prev => {
      const newArray = [...prev[section]] as any[];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [section]: newArray };
    });
  };

  const addArrayItem = (section: 'experience' | 'projects' | 'education', emptyItem: any) => {
    setFormData(prev => ({ ...prev, [section]: [...prev[section], emptyItem] }));
  };

  const removeArrayItem = (section: 'experience' | 'projects' | 'education', index: number) => {
    setFormData(prev => {
      const newArray = [...prev[section]];
      newArray.splice(index, 1);
      return { ...prev, [section]: newArray };
    });
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Generating your ATS Resume...');
    try {
      const res = await fetch('/api/resume/generate', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Generated! You have ${data.remaining} exports remaining this month.`, { id: toastId });
        window.print();
      } else {
        toast.error(data.error || 'Failed to generate resume.', { id: toastId, duration: 5000 });
      }
    } catch (e) {
      toast.error('Network error. Please try again.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const tierInfo = TIER_BADGE[tier];
  const TierIcon = tierInfo?.icon || Zap;

  const errorClass = (fieldId: string) => 
    errors.includes(fieldId) ? 'border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500' : '';

  return (
    <div className="px-6 py-8 md:px-8 max-w-5xl mx-auto flex flex-col h-full print:p-0 print:m-0 print:max-w-none">
      
      {/* Header - Hide on print */}
      <div className="print:hidden flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Resume Builder</h1>
          <p className="mt-1 text-muted-foreground">
            Build a clean, single-column, machine-readable resume designed to pass Applicant Tracking Systems.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`gap-1 ${tierInfo?.className}`}>
            <TierIcon className="h-3 w-3" />
            {tierInfo?.label} Plan
          </Badge>
        </div>
      </div>

      {/* Progress Bar - Hide on print */}
      <div className="print:hidden mb-8 flex justify-between relative before:absolute before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-border before:z-0">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === currentStep;
          const isPassed = idx < currentStep;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-primary bg-primary/10 text-primary' : isPassed ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}>
                <StepIcon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 print:hidden">
        <div className="p-6 md:p-8 rounded-xl border border-border bg-card min-h-[400px] shadow-sm">
          
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-xl font-semibold">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                  <Input placeholder="John Doe" className={errorClass('basic.name')} value={formData.basic.name} onChange={e => updateBasic('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></label>
                  <Input type="email" placeholder="john@example.com" className={errorClass('basic.email')} value={formData.basic.email} onChange={e => updateBasic('email', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                  <Input placeholder="+1 234 567 890" className={errorClass('basic.phone')} value={formData.basic.phone} onChange={e => updateBasic('phone', e.target.value)} />
                </div>
                
                {/* Mandatory Address Fields */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">House / Flat No. <span className="text-red-500">*</span></label>
                  <Input placeholder="House 123, Street Name" className={errorClass('basic.house')} value={formData.basic.house} onChange={e => updateBasic('house', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Town / Village <span className="text-red-500">*</span></label>
                  <Input placeholder="Downtown" className={errorClass('basic.town')} value={formData.basic.town} onChange={e => updateBasic('town', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">District <span className="text-red-500">*</span></label>
                  <Input placeholder="North District" className={errorClass('basic.district')} value={formData.basic.district} onChange={e => updateBasic('district', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
                  <Input placeholder="Metropolis" className={errorClass('basic.city')} value={formData.basic.city} onChange={e => updateBasic('city', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">State <span className="text-red-500">*</span></label>
                  <Input placeholder="CA" className={errorClass('basic.state')} value={formData.basic.state} onChange={e => updateBasic('state', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Country <span className="text-red-500">*</span></label>
                  <Input placeholder="United States" className={errorClass('basic.country')} value={formData.basic.country} onChange={e => updateBasic('country', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">PIN / ZIP Code <span className="text-red-500">*</span></label>
                  <Input placeholder="12345" className={errorClass('basic.pin_code')} value={formData.basic.pin_code} onChange={e => updateBasic('pin_code', e.target.value)} />
                </div>
                <div className="space-y-1.5"></div> {/* Empty column for layout balance */}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">LinkedIn URL (Optional)</label>
                  <Input placeholder="linkedin.com/in/johndoe" value={formData.basic.linkedin} onChange={e => updateBasic('linkedin', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">GitHub / Portfolio (Optional)</label>
                  <Input placeholder="github.com/johndoe" value={formData.basic.github} onChange={e => updateBasic('github', e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Professional Summary <span className="text-red-500">*</span></h2>
              <p className="text-sm text-muted-foreground mb-4">A brief 2-3 sentence overview of your professional background and goals. Keep it keyword-rich for ATS.</p>
              <Textarea 
                placeholder="Results-driven Software Engineer with 3+ years of experience building scalable web applications using React and Node.js..."
                className={`h-40 ${errorClass('summary')}`}
                value={formData.summary}
                onChange={e => {
                  setErrors(prev => prev.filter(err => err !== 'summary'));
                  setFormData(prev => ({ ...prev, summary: e.target.value }));
                }}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <Button variant="outline" size="sm" onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', description: '' })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Role
                </Button>
              </div>
              
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border/50 bg-surface-1/30 space-y-4 relative group">
                  {formData.experience.length > 1 && (
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('experience', idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Company Name <span className="text-red-500">*</span></label>
                      <Input placeholder="Tech Solutions Inc." className={errorClass(`exp.${idx}.company`)} value={exp.company} onChange={e => updateArray('experience', idx, 'company', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Job Title <span className="text-red-500">*</span></label>
                      <Input placeholder="Senior Developer" className={errorClass(`exp.${idx}.role`)} value={exp.role} onChange={e => updateArray('experience', idx, 'role', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Duration <span className="text-red-500">*</span></label>
                      <Input placeholder="Jan 2021 - Present" className={errorClass(`exp.${idx}.duration`)} value={exp.duration} onChange={e => updateArray('experience', idx, 'duration', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Description (Use bullet points: • ) <span className="text-red-500">*</span></label>
                      <Textarea placeholder="• Led development of...&#10;• Increased performance by 40%..." className={`h-32 ${errorClass(`exp.${idx}.description`)}`} value={exp.description} onChange={e => updateArray('experience', idx, 'description', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Key Projects</h2>
                <Button variant="outline" size="sm" onClick={() => addArrayItem('projects', { title: '', tech_stack: '', link: '', description: '' })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Project
                </Button>
              </div>
              
              {formData.projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border/50 bg-surface-1/30 space-y-4 relative group">
                  {formData.projects.length > 1 && (
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('projects', idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Project Title <span className="text-red-500">*</span></label>
                      <Input placeholder="E-commerce Dashboard" className={errorClass(`proj.${idx}.title`)} value={proj.title} onChange={e => updateArray('projects', idx, 'title', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Link (Optional)</label>
                      <Input placeholder="github.com/..." value={proj.link} onChange={e => updateArray('projects', idx, 'link', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Tech Stack (comma separated) <span className="text-red-500">*</span></label>
                      <Input placeholder="React, Node.js, PostgreSQL" className={errorClass(`proj.${idx}.tech_stack`)} value={proj.tech_stack} onChange={e => updateArray('projects', idx, 'tech_stack', e.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Description (Use bullet points: • ) <span className="text-red-500">*</span></label>
                      <Textarea placeholder="• Built a full-stack dashboard...&#10;• Integrated Stripe API..." className={`h-24 ${errorClass(`proj.${idx}.description`)}`} value={proj.description} onChange={e => updateArray('projects', idx, 'description', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Education</h2>
                <Button variant="outline" size="sm" onClick={() => addArrayItem('education', { institution: '', degree: '', field: '', year: '', cgpa: '' })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Education
                </Button>
              </div>
              
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-border/50 bg-surface-1/30 space-y-4 relative group">
                   {formData.education.length > 1 && (
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeArrayItem('education', idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Institution Name <span className="text-red-500">*</span></label>
                      <Input placeholder="University of Technology" className={errorClass(`edu.${idx}.institution`)} value={edu.institution} onChange={e => updateArray('education', idx, 'institution', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Degree <span className="text-red-500">*</span></label>
                      <Input placeholder="Bachelor of Science" className={errorClass(`edu.${idx}.degree`)} value={edu.degree} onChange={e => updateArray('education', idx, 'degree', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Field of Study <span className="text-red-500">*</span></label>
                      <Input placeholder="Computer Science" className={errorClass(`edu.${idx}.field`)} value={edu.field} onChange={e => updateArray('education', idx, 'field', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Graduation Year & GPA <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <Input placeholder="2023" className={`flex-1 ${errorClass(`edu.${idx}.year`)}`} value={edu.year} onChange={e => updateArray('education', idx, 'year', e.target.value)} />
                        <Input placeholder="3.8/4.0" className={`flex-1 ${errorClass(`edu.${idx}.cgpa`)}`} value={edu.cgpa} onChange={e => updateArray('education', idx, 'cgpa', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Skills (ATS Keywords) <span className="text-red-500">*</span></h2>
              <p className="text-sm text-muted-foreground mb-4">List your core technical and soft skills, separated by commas. These act as critical keywords for ATS parsers.</p>
              <Textarea 
                placeholder="JavaScript, TypeScript, React, Next.js, Node.js, Python, SQL, Git, Agile Methodology, Communication..."
                className={`h-32 ${errorClass('skills')}`}
                value={formData.skills}
                onChange={e => {
                  setErrors(prev => prev.filter(err => err !== 'skills'));
                  setFormData(prev => ({ ...prev, skills: e.target.value }));
                }}
              />
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your ATS-Friendly Resume is Ready</h2>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  Click below to trigger the browser's print dialog. Make sure to select "Save as PDF" and uncheck "Headers and footers" for the best result.
                </p>
              </div>
              <Button onClick={handlePrint} disabled={isGenerating} size="lg" className="gap-2 mt-4 text-white bg-primary hover:bg-primary/90">
                {isGenerating ? <Zap className="h-5 w-5 animate-pulse" /> : <Download className="h-5 w-5" />}
                {isGenerating ? 'Checking Limits...' : 'Save as PDF'}
              </Button>
            </motion.div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next Step <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
             <div></div>
          )}
        </div>
      </div>

      {/* --- ATS PRINTABLE RESUME (Hidden on screen, visible on print) --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 1in; size: letter; }
          body { background: white !important; color: #111 !important; }
          .print-only { display: block !important; }
          
          /* Hide all Ardent layout chrome (sidebar, topnav, toasts) */
          aside, header, nav, [data-sonner-toaster] {
            display: none !important;
          }
          
          /* Override any scroll containers that break PDF pagination */
          html, body, main, div {
            overflow: visible !important;
            height: auto !important;
          }
          
          /* Remove any lingering borders or shadows from layout */
          * {
            box-shadow: none !important;
          }
        }
      `}} />
      
      <div className="hidden print-only print:block max-w-4xl mx-auto bg-white text-black font-serif text-[11pt] leading-relaxed">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold uppercase tracking-widest mb-3 text-gray-900">{formData.basic.name || 'YOUR NAME'}</h1>
          <div className="text-[10pt] flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-gray-700">
            {/* Built complete address string safely */}
            {[formData.basic.house, formData.basic.town, formData.basic.district, formData.basic.city, formData.basic.state, formData.basic.country, formData.basic.pin_code]
              .filter(Boolean)
              .join(', ') && (
              <span>
                {[formData.basic.house, formData.basic.town, formData.basic.district, formData.basic.city, formData.basic.state, formData.basic.country, formData.basic.pin_code]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
            
            {(formData.basic.house || formData.basic.town || formData.basic.city) && (formData.basic.phone || formData.basic.email) && <span>|</span>}
            {formData.basic.phone && <span>{formData.basic.phone}</span>}
            {formData.basic.phone && formData.basic.email && <span>|</span>}
            {formData.basic.email && <span>{formData.basic.email}</span>}
            
            {formData.basic.linkedin && <span>|</span>}
            {formData.basic.linkedin && <span>{formData.basic.linkedin.replace('https://', '').replace('www.', '')}</span>}
            
            {formData.basic.github && <span>|</span>}
            {formData.basic.github && <span>{formData.basic.github.replace('https://', '').replace('www.', '')}</span>}
          </div>
        </div>

        {/* Summary */}
        {formData.summary && (
          <div className="mb-8">
            <h2 className="text-[13pt] font-bold uppercase border-b-[1.5px] border-black pb-1.5 mb-3 tracking-wide">Professional Summary</h2>
            <p className="text-[10.5pt] text-justify leading-relaxed">{formData.summary}</p>
          </div>
        )}

        {/* Experience */}
        {formData.experience.some(e => e.company || e.role) && (
          <div className="mb-8">
            <h2 className="text-[13pt] font-bold uppercase border-b-[1.5px] border-black pb-1.5 mb-4 tracking-wide">Work Experience</h2>
            <div className="space-y-5">
              {formData.experience.filter(e => e.company || e.role).map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-[11pt] mb-1">
                    <span>{exp.company} <span className="font-normal italic">{exp.role ? ` - ${exp.role}` : ''}</span></span>
                    <span className="text-[10pt] font-medium">{exp.duration}</span>
                  </div>
                  {exp.description && (
                    <div className="mt-1.5 text-[10.5pt] pl-5 space-y-1.5">
                      {exp.description.split('•').filter(Boolean).map((line, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="text-black/70">•</span>
                          <span className="flex-1 leading-relaxed">{line.trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {formData.projects.some(p => p.title) && (
          <div className="mb-8">
            <h2 className="text-[13pt] font-bold uppercase border-b-[1.5px] border-black pb-1.5 mb-4 tracking-wide">Projects</h2>
            <div className="space-y-5">
              {formData.projects.filter(p => p.title).map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-[11pt] mb-1">
                    <span>{proj.title} <span className="font-normal italic text-black/80">{proj.tech_stack ? ` | ${proj.tech_stack}` : ''}</span></span>
                    {proj.link && <span className="text-[9.5pt] font-medium">{proj.link.replace('https://', '').replace('www.', '')}</span>}
                  </div>
                  {proj.description && (
                    <div className="mt-1.5 text-[10.5pt] pl-5 space-y-1.5">
                      {proj.description.split('•').filter(Boolean).map((line, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="text-black/70">•</span>
                          <span className="flex-1 leading-relaxed">{line.trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {formData.education.some(e => e.institution) && (
          <div className="mb-8">
            <h2 className="text-[13pt] font-bold uppercase border-b-[1.5px] border-black pb-1.5 mb-4 tracking-wide">Education</h2>
            <div className="space-y-4">
              {formData.education.filter(e => e.institution).map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-[11pt]">{edu.institution}</span>
                    {(edu.degree || edu.field) && (
                      <span className="text-[10.5pt]"> &mdash; {edu.degree} {edu.field}</span>
                    )}
                  </div>
                  <div className="text-[10.5pt] text-right font-medium">
                    {edu.year && <span>{edu.year}</span>}
                    {edu.year && edu.cgpa && <span className="mx-1">|</span>}
                    {edu.cgpa && <span>GPA: {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {formData.skills && (
          <div className="mb-8">
            <h2 className="text-[13pt] font-bold uppercase border-b-[1.5px] border-black pb-1.5 mb-3 tracking-wide">Technical Skills</h2>
            <p className="text-[10.5pt] leading-relaxed">
              {formData.skills}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
