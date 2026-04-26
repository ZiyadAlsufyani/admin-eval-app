import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AcademicTerm } from '@/utils/academicCalendar';

export const useAcademicTermsQuery = () => {
  return useQuery({
    queryKey: ['academicTerms'],
    queryFn: async (): Promise<AcademicTerm[]> => {
      const { data, error } = await supabase
        .from('academic_terms')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching academic terms:', error);
        throw error;
      }

      return data as AcademicTerm[];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
};
