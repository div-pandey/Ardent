// Supabase Database Types

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  current_role: string | null;
  target_role: string | null;
  experience_level: 'student' | 'entry' | 'mid' | 'senior' | 'lead' | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  raw_text: string | null;
  parsed_skills: ParsedSkill[];
  parsed_roles: ParsedRole[];
  parsed_projects: ParsedProject[];
  parsed_education: ParsedEducation[];
  parsed_certifications: ParsedCertification[];
  resume_score: number | null;
  score_breakdown: Record<string, number> | null;
  is_primary: boolean;
  parsing_status: 'pending' | 'parsing' | 'completed' | 'failed';
  parsing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobAnalysis {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  description: string;
  source_url: string | null;
  extracted_skills: ParsedSkill[];
  extracted_technologies: string[];
  extracted_requirements: string[];
  role_level: string | null;
  match_score: number | null;
  gap_analysis: GapAnalysisResult | null;
  parsing_status: 'pending' | 'parsing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CareerPathRecord {
  id: string;
  user_id: string;
  current_role: string;
  target_role: string;
  selected_route: CareerRoute;
  all_routes: CareerRoute[];
  is_active: boolean;
  readiness_score: number;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  career_path_id: string;
  title: string;
  total_weeks: number;
  total_milestones: number;
  is_active: boolean;
  started_at: string;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  description: string | null;
  week_start: number;
  week_end: number;
  order_index: number;
  skills_covered: string[];
  status: 'locked' | 'active' | 'in_progress' | 'completed' | 'skipped';
  project: MilestoneProject | null;
  resources: MilestoneResource[];
  certification: MilestoneCertification | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  milestone_id: string;
  user_id: string;
  day_number: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface ProgressTracking {
  id: string;
  user_id: string;
  date: string;
  readiness_score: number;
  skills_total: number;
  skills_completed: number;
  milestones_total: number;
  milestones_completed: number;
  streak_count: number;
  activities: ProgressActivity[];
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  category: string | null;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  source: 'manual' | 'resume' | 'onboarding';
  is_verified: boolean;
  created_at: string;
}

// Nested types
export interface ParsedSkill {
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  confirmed?: boolean;
}

export interface ParsedRole {
  title: string;
  company: string;
  duration: string;
  current: boolean;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface ParsedCertification {
  name: string;
  provider: string;
}

export interface CareerRoute {
  name: string;
  steps: CareerRouteStep[];
  estimatedMonths: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  skillOverlapPercent?: number;
}

export interface CareerRouteStep {
  role: string;
  skills: string[];
}

export interface GapAnalysisResult {
  readinessScore: number;
  matchingSkills: string[];
  missingSkills: SkillGap[];
  transferableSkills: string[];
}

export interface SkillGap {
  name: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  importance: 'must_have' | 'nice_to_have' | 'bonus';
  prerequisites: string[];
  prerequisitesMet: boolean;
  priorityScore: number;
}

export interface MilestoneProject {
  name: string;
  description: string;
  skills_demonstrated: string[];
  estimated_hours: number;
  difficulty: string;
}

export interface MilestoneResource {
  title: string;
  url: string;
  type: 'course' | 'article' | 'video' | 'book' | 'documentation';
}

export interface MilestoneCertification {
  name: string;
  provider: string;
  url: string;
}

export interface ProgressActivity {
  type: 'skill_completed' | 'milestone_completed' | 'task_completed' | 'guide_session';
  description: string;
  timestamp: string;
}
