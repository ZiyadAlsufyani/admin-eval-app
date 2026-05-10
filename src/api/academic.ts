import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FiscalYear, Holiday } from '@/utils/academicCalendar';

export const useFiscalYearsQuery = () => {
  return useQuery({
    queryKey: ['fiscalYears'],
    queryFn: async (): Promise<FiscalYear[]> => {
      const { data, error } = await supabase
        .from('fiscal_years')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching fiscal years:', error);
        throw error;
      }

      return data as FiscalYear[];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
};

export const useHolidaysQuery = () => {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async (): Promise<Holiday[]> => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*');

      if (error) {
        console.error('Error fetching holidays:', error);
        throw error;
      }

      return data as Holiday[];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
};
