import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useStaffQuery } from '@/api/staff';
import { useQueryClient } from '@tanstack/react-query';
import type { StaffMember } from '@/types/staff';
import { useAuth } from '@/components/auth/AuthProvider';

export type StaffOutletContext = {
  staffList: StaffMember[];
  updateStaffStatus: (id: string, updates: Partial<StaffMember>) => void;
};

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  const isPrincipal = profile?.role === 'principal';
  
  // Fetch real data via TanStack + Supabase
  const { data: staffList = [], isLoading } = useStaffQuery();

  // Create a bridging function that updates the TanStack cache directly 
  // (acting exactly like our old mock hook but for real data caching)
  const updateStaffStatus = (id: string, updates: Partial<StaffMember>) => {
    queryClient.setQueryData<StaffMember[]>(['staff'], (old) => {
      if (!old) return [];
      return old.map(staff => staff.id === id ? { ...staff, ...updates } : staff);
    });
  };

  // Map route paths to valid BottomNav activeIds
  const currentPath = location.pathname;
  let activeTab = 'home';
  if (currentPath === '/tasks') activeTab = 'tasks';
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
      <Outlet context={{ staffList, updateStaffStatus }} />
      <BottomNav
        activeId={activeTab}
        onNavigate={handleNavigation}
        items={navItems}
      />
    </div>
  );
}
