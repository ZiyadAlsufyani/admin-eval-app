export type EvaluationMetric = {
  id: string;
  name: string; // e.g., 'Discipline' or 'Competencies'
  score: number; // 0-100 scale ideally
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string; // Optional future support for profile images
  metrics: Record<string, EvaluationMetric>; // Map of metric ID to the actual score object
};

export type DashboardStats = {
  urgentActions: number;
  pendingEvaluations: number;
};
