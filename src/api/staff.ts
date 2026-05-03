import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StaffMember } from '@/types/staff';
import { formatISODate } from '@/utils/date';

export function useStaffQuery(weekStartDate?: Date) {
  const weekString = weekStartDate ? formatISODate(weekStartDate) : 'current';
  return useQuery({
    queryKey: ['staff', weekString],
    queryFn: async (): Promise<StaffMember[]> => {
      // Fetch all staff members from the current principal's school
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');

      if (error) {
        throw error;
      }

      // Fetch evaluations for the specific week
      let evaluations: any[] = [];
      if (weekStartDate) {
        const { data: evalData, error: evalErr } = await supabase
          .from('discipline_evaluations')
          .select('staff_id, status')
          .eq('week_start_date', weekString);
          
        if (!evalErr && evalData) {
          evaluations = evalData;
        }
      }

      // Build a Map for O(1) lookups instead of O(n*m) .find() inside .map()
      const evaluationsByStaffId = new Map(
        evaluations.map((evaluation: any) => [evaluation.staff_id, evaluation] as const)
      );

      // Map from Supabase Profile schema back to UI StaffMember shape
      return profiles.map((profile: any): StaffMember => {
        const evaluation = evaluationsByStaffId.get(profile.id);
        const isDraft = evaluation?.status === 'draft';
        const isCompleted = evaluation?.status === 'submitted';

        return {
          id: profile.id,
          name: profile.full_name,
          role: profile.job_title || 'الاداري/ة',
          avatarUrl: profile.avatar_url,
          created_at: profile.created_at,
          subject: profile.job_title,
          dueDate: 'الخميس، 04:00 م',
          status: isCompleted ? 'مكتمل' : isDraft ? 'مسودة' : 'معلق',
          isDraft,
          metrics: {
            discipline: { id: 'discipline', name: 'الانضباط', score: Math.floor(Math.random() * 20) + 80 },
            competencies: { id: 'competencies', name: 'الجدارات', score: Math.floor(Math.random() * 20) + 80 },
          }
        };
      });
    }
  });
}

/**
 * Fetches a single staff member's profile by ID.
 * Uses a narrow column selection so that no other staff data is fetched or exposed.
 * Intended for use when viewing a single profile (both staff self-view and principal view).
 */
export function useStaffProfileQuery(staffId: string | undefined) {
  return useQuery({
    queryKey: ['staff_profile', staffId],
    queryFn: async (): Promise<Pick<StaffMember, 'id' | 'name' | 'role' | 'avatarUrl' | 'created_at'>> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, avatar_url, created_at')
        .eq('id', staffId!)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.full_name,
        role: data.job_title || 'الاداري/ة',
        avatarUrl: data.avatar_url,
        created_at: data.created_at,
      };
    },
    enabled: !!staffId,
  });
}
