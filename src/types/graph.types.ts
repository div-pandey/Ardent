// Neo4j Graph Types — Career Intelligence Graph

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  properties: Record<string, unknown>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  properties: Record<string, unknown>;
}

export interface CareerGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type NodeType =
  | 'user'
  | 'skill'
  | 'skill_missing'
  | 'role'
  | 'role_target'
  | 'technology'
  | 'certification'
  | 'project'
  | 'learning_path';

export type RelationshipType =
  | 'HAS_SKILL'
  | 'TARGETS_ROLE'
  | 'CURRENTLY_IN'
  | 'REQUIRES_SKILL'
  | 'LEADS_TO'
  | 'DEPENDS_ON'
  | 'RELATED_TO'
  | 'USED_IN'
  | 'USES_TECHNOLOGY'
  | 'VALIDATES'
  | 'DEMONSTRATES'
  | 'RECOMMENDED_FOR'
  | 'INCLUDES'
  | 'TARGETS'
  | 'STARTS_FROM'
  | 'COMPLETED_PROJECT'
  | 'EARNED_CERTIFICATION';

export const NODE_COLORS: Record<NodeType, string> = {
  user: '#FFFFFF',
  skill: '#22D3EE',
  skill_missing: '#475569',
  role: '#64748B',
  role_target: '#FBBF24',
  technology: '#A78BFA',
  certification: '#34D399',
  project: '#F472B6',
  learning_path: '#3B82F6',
};

export const NODE_SIZES: Record<NodeType, number> = {
  user: 24,
  skill: 14,
  skill_missing: 12,
  role: 18,
  role_target: 22,
  technology: 14,
  certification: 14,
  project: 14,
  learning_path: 16,
};

export interface CareerPath {
  id: string;
  routes: CareerPathRoute[];
  currentRole: string;
  targetRole: string;
}

export interface CareerPathRoute {
  name: string;
  roles: string[];
  totalMonths: number;
  difficulty: string;
  skillOverlapPercent: number;
  isRecommended: boolean;
}

export interface SkillGapResult {
  readinessScore: number;
  totalRequired: number;
  acquiredCount: number;
  matchingSkills: SkillInfo[];
  missingSkills: SkillGapInfo[];
  transferableSkills: SkillInfo[];
}

export interface SkillInfo {
  name: string;
  category: string;
  proficiency?: string;
}

export interface SkillGapInfo {
  name: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  importance: string;
  prerequisites: string[];
  prerequisitesMet: boolean;
  priorityScore: number;
}

export interface SkillRecommendation {
  name: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  relevanceScore: number;
  importance: string | null;
}
