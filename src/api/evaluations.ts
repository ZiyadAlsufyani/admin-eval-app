import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type EvaluationDetail = {
  category_name: string;
  score: number;
  justification_notes?: string;
  evidence_file_url?: string;
  attachments?: string[];
};

export type SaveEvaluationPayload = {
  school_id: string;
  staff_id: string;
  evaluator_id: string;
  academic_year: string;
  week_start_date: string; // YYYY-MM-DD
  status: 'draft' | 'submitted';
  general_notes?: string;
  overall_score_percentage?: number;
  term_id?: string;
  academic_week_number?: number;
  details: EvaluationDetail[];
};

export function useEvaluationQuery(staffId: string, weekStartDate: string) {
  return useQuery({
    queryKey: ['evaluation', staffId, weekStartDate],
    queryFn: async () => {
      // 1. Fetch main evaluation record
      const { data: evalData, error: evalError } = await supabase
        .from('discipline_evaluations')
        .select('*')
        .eq('staff_id', staffId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

      if (evalError) throw evalError;
      if (!evalData) return null;

      // 2. Fetch details
      const { data: detailsData, error: detailsError } = await supabase
        .from('discipline_evaluation_details')
        .select('*')
        .eq('evaluation_id', evalData.id);

      if (detailsError) throw detailsError;

      return {
        ...evalData,
        details: detailsData || [],
      };
    },
    enabled: !!staffId && !!weekStartDate,
  });
}

export function useSaveEvaluationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveEvaluationPayload) => {
      const { data, error } = await supabase.rpc('save_discipline_evaluation', {
        p_school_id: payload.school_id,
        p_staff_id: payload.staff_id,
        p_evaluator_id: payload.evaluator_id,
        p_academic_year: payload.academic_year,
        p_week_start_date: payload.week_start_date,
        p_status: payload.status,
        p_general_notes: payload.general_notes || null,
        p_overall_score_percentage: payload.overall_score_percentage || null,
        p_term_id: payload.term_id || null,
        p_academic_week_number: payload.academic_week_number || null,
        p_details: payload.details,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the evaluation query so it refetches next time
      queryClient.invalidateQueries({
        queryKey: ['evaluation', variables.staff_id, variables.week_start_date],
      });
      // Also invalidate the staff list if we are using it to track 'draft' vs 'completed' statuses
      queryClient.invalidateQueries({
        queryKey: ['staff', variables.week_start_date],
      });
      // Invalidate cumulative performance
      queryClient.invalidateQueries({
        queryKey: ['cumulative_performance', variables.school_id, variables.academic_year],
      });
    },
  });
}

export function useCumulativePerformanceQuery(schoolId: string | undefined, academicYear: string | undefined) {
  return useQuery({
    queryKey: ['cumulative_performance', schoolId, academicYear],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cumulative_staff_averages', {
        p_academic_year: academicYear,
        p_school_id: schoolId,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }

      // Transform array into a fast O(1) lookup dictionary map
      const performanceMap: Record<string, number> = {};
      data?.forEach((row: { staff_id: string; average_score: number }) => {
        performanceMap[row.staff_id] = Number(row.average_score);
      });
      
      return performanceMap;
    },
    enabled: !!schoolId && !!academicYear,
  });
}

export function useStaffEvaluationsHistoryQuery(staffId: string | undefined, academicYear: string | undefined) {
  return useQuery({
    queryKey: ['evaluations_history', staffId, academicYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipline_evaluations')
        .select('*')
        .eq('staff_id', staffId)
        .eq('academic_year', academicYear)
        .eq('status', 'submitted')
        .order('week_start_date', { ascending: false });

      if (error) {
        console.error("Error fetching historical evaluations:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!staffId && !!academicYear,
  });
}

export function useEvaluationDetailQuery(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['evaluation_detail', evaluationId],
    queryFn: async () => {
      // 1. Fetch main evaluation record
      const { data: evalData, error: evalError } = await supabase
        .from('discipline_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .maybeSingle();

      if (evalError) throw evalError;
      if (!evalData) return null;

      // 2. Fetch details (sub-scores)
      const { data: detailsData, error: detailsError } = await supabase
        .from('discipline_evaluation_details')
        .select('*')
        .eq('evaluation_id', evaluationId);

      if (detailsError) throw detailsError;

      // 3. Fetch staff info to display name/role if needed, though profile is usually separate
      const { data: staffData } = await supabase
        .from('profiles')
        .select('full_name, job_title, avatar_url')
        .eq('id', evalData.staff_id)
        .maybeSingle();

      return {
        ...evalData,
        staff: staffData || null,
        details: detailsData || [],
      };
    },
    enabled: !!evaluationId,
  });
}
