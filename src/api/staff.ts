import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StaffMember } from '@/types/staff';

export function useStaffQuery() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<StaffMember[]> => {
      // Fetch all staff members from the current principal's school
      // Our RLS policy automatically filters this to ONLY auth.user()'s school!
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');

      if (error) {
        throw error;
      }

      // Map from Supabase Profile schema back to UI StaffMember shape
      return data.map((profile: any): StaffMember => ({
        id: profile.id,
        name: profile.full_name,
        role: profile.job_title || 'معلم',
        avatarUrl: profile.avatar_url,
        subject: profile.job_title,
        dueDate: 'اليوم، 04:00 م', // Placeholder until evaluations table is wired
        status: 'اليوم',           // Placeholder until evaluations table is wired
        isDraft: false,
        metrics: {
          discipline: { id: 'discipline', name: 'الانضباط', score: Math.floor(Math.random() * 20) + 80 },
          competencies: { id: 'competencies', name: 'الجدارات', score: Math.floor(Math.random() * 20) + 80 },
        }
      }));
    }
  });
}
