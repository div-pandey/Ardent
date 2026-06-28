// API Response Types

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Guide Types
export interface GuideMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GuideContext {
  userName: string;
  currentRole: string | null;
  targetRole: string | null;
  readinessScore: number;
  currentSkills: { name: string; proficiency: string }[];
  missingSkills: { name: string; priority: string; difficulty: string }[];
  activeRoute: {
    name: string;
    steps: { role: string; skills: string[] }[];
  } | null;
  currentWeek: number;
  milestonesCompleted: number;
  totalMilestones: number;
  currentMilestone: { title: string } | null;
}

// Roadmap Generation Types
export interface RoadmapGenerationInput {
  currentRole: string;
  targetRole: string;
  missingSkills: {
    name: string;
    difficulty: string;
    estimatedHours: number;
    prerequisites: string[];
  }[];
  existingSkills: string[];
}

export interface GeneratedRoadmap {
  title: string;
  totalWeeks: number;
  milestones: GeneratedMilestone[];
}

export interface GeneratedMilestone {
  title: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  skillsCovered: string[];
  dailyGoals: { day: number; title: string; description: string }[];
  project: {
    name: string;
    description: string;
    skillsDemonstrated: string[];
    estimatedHours: number;
    difficulty: string;
  };
  resources: {
    title: string;
    url: string;
    type: 'course' | 'article' | 'video' | 'book' | 'documentation';
  }[];
  certification?: {
    name: string;
    provider: string;
    url: string;
  };
}

// User Session Type
export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}
