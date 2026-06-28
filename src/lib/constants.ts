/**
 * Application Constants
 */

// App Metadata
export const APP_NAME = 'Ardent';
export const APP_TAGLINE = 'Every career has a path. See yours.';
export const APP_DESCRIPTION =
  'Ardent is a Career Intelligence Platform that helps professionals discover, visualize, and navigate the most effective path from their current position to their desired future role.';

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.docx'];

// API Timeouts
export const API_TIMEOUT = 30000; // 30 seconds
export const AI_TIMEOUT = 60000; // 60 seconds for AI operations

// Graph Visualization
export const MAX_VISIBLE_NODES = 200;
export const GRAPH_FORCE_STRENGTH = -200;
export const GRAPH_LINK_DISTANCE = 80;
export const GRAPH_COLLISION_RADIUS = 30;

// Roadmap
export const MAX_MILESTONES = 20;
export const DEFAULT_DAILY_GOALS = 7;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Routes
export const PUBLIC_ROUTES = ['/', '/login', '/register'];
export const AUTH_ROUTES = ['/login', '/register'];
export const ONBOARDING_ROUTE = '/onboarding';

// Navigation Items
export const NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: 'Home' },
  { label: 'Career Graph', href: '/graph', icon: 'Sparkles' },
  { label: 'Career Paths', href: '/paths', icon: 'Route' },
  { label: 'Roadmap', href: '/roadmap', icon: 'Map' },
  { label: 'Ardent Guide', href: '/guide', icon: 'Compass' },
  { label: 'Progress', href: '/progress', icon: 'BarChart3' },
  { label: 'Resume', href: '/resume', icon: 'FileText' },
  { label: 'Jobs', href: '/jobs', icon: 'Briefcase' },
] as const;

// Experience Levels
export const EXPERIENCE_LEVELS = [
  { value: 'student', label: 'Student' },
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'lead', label: 'Lead / Principal (10+ years)' },
] as const;
