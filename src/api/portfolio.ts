import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type StaffAchievement = {
  id?: string;
  staff_id: string;
  school_id: string;
  type: 'course' | 'certificate';
  title: string;
  role?: string | null;
  hours?: number | null;
  document_url?: string | null;
  fiscal_month: number;
  fiscal_year_label: string;
  created_at?: string;
};

export function usePortfolioQuery(staffId: string | undefined, fiscalYearLabel: string | undefined, fiscalMonth: number | undefined) {
  return useQuery({
    queryKey: ['portfolio', staffId, fiscalYearLabel, fiscalMonth],
    queryFn: async () => {
      if (!staffId || !fiscalYearLabel || !fiscalMonth) return [];

      const { data, error } = await supabase
        .from('staff_achievements')
        .select('*')
        .eq('staff_id', staffId)
        .eq('fiscal_year_label', fiscalYearLabel)
        .eq('fiscal_month', fiscalMonth)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching portfolio:', error);
        throw error;
      }

      return data as StaffAchievement[];
    },
    enabled: !!staffId && !!fiscalYearLabel && !!fiscalMonth,
  });
}

export function useSavePortfolioMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievements: StaffAchievement[]) => {
      if (!achievements.length) return [];

      // We use upsert so we can update existing entries if we pass their IDs
      const { data, error } = await supabase
        .from('staff_achievements')
        .upsert(achievements)
        .select();

      if (error) {
        console.error('Error saving portfolio:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['portfolio', variables[0].staff_id, variables[0].fiscal_year_label, variables[0].fiscal_month],
        });
      }
    },
  });
}
