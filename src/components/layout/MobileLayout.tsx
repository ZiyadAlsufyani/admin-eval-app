import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useStaffQuery } from '@/api/staff';
import { useQueryClient } from '@tanstack/react-query';
import type { StaffMember } from '@/types/staff';
import { useAuth } from '@/components/auth/AuthProvider';
import { getStartOfWeek, formatISODate } from '@/utils/date';
import { useAcademicTermsQuery, useHolidaysQuery } from '@/api/academic';
import { getAcademicContext, type AcademicContext, type Holiday } from '@/utils/academicCalendar';
import { PwaUpdateToast } from '@/components/ui/PwaUpdateToast';

export type StaffOutletContext = {
  staffList: StaffMember[];
  updateStaffStatus: (id: string, updates: Partial<StaffMember>) => void;
  selectedEvaluationWeek: Date;
  setSelectedEvaluationWeek: (date: Date) => void;
  academicContext: AcademicContext | null;
  currentAcademicContext: AcademicContext | null;
  holidays: Holiday[];
};

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [selectedEvaluationWeek, setSelectedEvaluationWeekState] = useState<Date>(() => {
    const saved = localStorage.getItem('selectedEvaluationWeek');
    return saved ? new Date(saved) : getStartOfWeek();
  });
  
  const setSelectedEvaluationWeek = (date: Date) => {
    localStorage.setItem('selectedEvaluationWeek', date.toISOString());
    setSelectedEvaluationWeekState(date);
  };
  
  const isPrincipal = profile?.role === 'principal';
  
  // Fetch terms, holidays, and calculate academic context
  const { data: terms = [], isLoading: isTermsLoading } = useAcademicTermsQuery();
  const { data: holidays = [], isLoading: isHolidaysLoading } = useHolidaysQuery();
  
  const academicContext = getAcademicContext(selectedEvaluationWeek, terms, holidays);
  const currentAcademicContext = getAcademicContext(new Date(), terms, holidays);

  // Fetch real data via TanStack + Supabase
  const { data: staffList = [], isLoading: isStaffLoading } = useStaffQuery(selectedEvaluationWeek);

  const isLoading = isTermsLoading || isHolidaysLoading || isStaffLoading;

  // Create a bridging function that updates the TanStack cache directly 
  // (acting exactly like our old mock hook but for real data caching)
  const updateStaffStatus = (id: string, updates: Partial<StaffMember>) => {
    const weekString = formatISODate(selectedEvaluationWeek);
    queryClient.setQueryData<StaffMember[]>(['staff', weekString], (old) => {
      if (!old) return [];
      return old.map(staff => staff.id === id ? { ...staff, ...updates } : staff);
    });
  };

  // Map route paths to valid BottomNav activeIds
  const currentPath = location.pathname;
  let activeTab = 'home';
  if (currentPath === '/tasks' || currentPath.startsWith('/evaluate')) activeTab = 'tasks';
  if (currentPath.startsWith('/staff')) activeTab = 'staff';

  const handleNavigation = (id: string) => {
    if (id === 'home') navigate(isPrincipal ? '/admin-dashboard' : '/staff-dashboard');
    if (id === 'tasks') navigate('/tasks');
    if (id === 'staff') navigate('/staff');
  };

  if (isLoading && isPrincipal) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-bold text-foreground">
        جاري تحميل البيانات...
      </div>
    );
  }

  const navItems = isPrincipal ? [
    { id: 'home', label: 'الرئيسية', icon: 'Home' as const, href: '/admin-dashboard' },
    { id: 'tasks', label: 'المهام', icon: 'CheckSquare' as const, href: '/tasks' },
    { id: 'staff', label: 'الاداريين', icon: 'Users' as const, href: '/staff' },
  ] : [
    { id: 'home', label: 'الرئيسية', icon: 'Home' as const, href: '/staff-dashboard' },
  ];

  return (
    <div className="min-h-screen bg-surface w-full max-w-md mx-auto relative shadow-2xl pb-20">
      <Outlet context={{ 
        staffList, 
        updateStaffStatus, 
        selectedEvaluationWeek, 
        setSelectedEvaluationWeek,
        academicContext,
        currentAcademicContext,
        holidays
      }} />
      <BottomNav
        activeId={activeTab}
        onNavigate={handleNavigation}
        items={navItems}
      />
      <PwaUpdateToast />
    </div>
  );
}
