export type EvaluationMetric = {
  id: string;
  name: string; // e.g., 'Discipline' or 'Competencies'
  score: number; // 0-100 scale ideally
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  created_at?: string;
  subject?: string; // Evaluated subject (e.g. الرياضيات)
  dueDate?: string; // Date string for evaluations
  status?: 'اليوم' | 'متأخر' | 'معلق' | 'مكتمل' | 'مسودة'; // Task deadline state
  isDraft?: boolean; // Form partially completed, waiting submission
  metrics: Record<string, EvaluationMetric>; // Map of metric ID to the actual score object
};

export type DashboardStats = {
  urgentActions: number;
  pendingEvaluations: number;
};
