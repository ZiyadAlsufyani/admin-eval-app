import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useStaffQuery } from '@/api/staff';
import { useQueryClient } from '@tanstack/react-query';
import type { StaffMember } from '@/types/staff';
import { useAuth } from '@/components/auth/AuthProvider';
import { getStartOfWeek, formatISODate } from '@/utils/date';
import { useFiscalYearsQuery, useHolidaysQuery } from '@/api/academic';
import { getFiscalContext, type FiscalContext, type Holiday } from '@/utils/academicCalendar';
import { PwaUpdateToast } from '@/components/ui/PwaUpdateToast';

export type StaffOutletContext = {
  staffList: StaffMember[];
  updateStaffStatus: (id: string, updates: Partial<StaffMember>) => void;
  selectedEvaluationWeek: Date;
  setSelectedEvaluationWeek: (date: Date) => void;
  fiscalContext: FiscalContext | null;
  currentFiscalContext: FiscalContext | null;
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
  
  // Fetch fiscal years, holidays, and calculate fiscal context
  const { data: fiscalYears = [], isLoading: isFiscalYearsLoading } = useFiscalYearsQuery();
  const { data: holidays = [], isLoading: isHolidaysLoading } = useHolidaysQuery();
  
  const fiscalContext = getFiscalContext(selectedEvaluationWeek, fiscalYears, holidays);
  const currentFiscalContext = getFiscalContext(new Date(), fiscalYears, holidays);

  // Fetch real data via TanStack + Supabase
  const { data: staffList = [], isLoading: isStaffLoading } = useStaffQuery(selectedEvaluationWeek);

  const isLoading = isFiscalYearsLoading || isHolidaysLoading || isStaffLoading;

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
  else if (currentPath.startsWith('/staff-dashboard')) activeTab = 'home';
  else if (currentPath.startsWith('/staff-profile')) activeTab = 'profile';
  else if (currentPath.startsWith('/staff-portfolio')) activeTab = 'portfolio';
  else if (currentPath.startsWith('/staff')) activeTab = 'staff';

  const handleNavigation = (id: string) => {
    if (id === 'home') navigate(isPrincipal ? '/admin-dashboard' : '/staff-dashboard');
    if (id === 'tasks') navigate('/tasks');
    if (id === 'staff') navigate('/staff');
    if (id === 'profile') navigate('/staff-profile');
    if (id === 'portfolio') navigate('/staff-portfolio');
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
    { id: 'portfolio', label: 'الإنجاز', icon: 'Briefcase' as const, href: '/staff-portfolio' },
    { id: 'profile', label: 'ملفي', icon: 'User' as const, href: '/staff-profile' },
  ];

  return (
    <div className="min-h-screen bg-surface w-full max-w-md mx-auto relative shadow-2xl pb-20">
      <Outlet context={{ 
        staffList, 
        updateStaffStatus, 
        selectedEvaluationWeek, 
        setSelectedEvaluationWeek,
        fiscalContext,
        currentFiscalContext,
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
