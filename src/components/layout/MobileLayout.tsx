import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/ui/bottom-nav';

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map route paths to valid BottomNav activeIds
  const currentPath = location.pathname;
  let activeTab = 'home';
  if (currentPath === '/tasks') activeTab = 'tasks';
  if (currentPath === '/reports') activeTab = 'reports';

  const handleNavigation = (id: string) => {
    // Determine target route based on ID
    if (id === 'home') navigate('/');
    if (id === 'tasks') navigate('/tasks');
    if (id === 'reports') navigate('/reports');
  };

  return (
    <div className="min-h-screen bg-surface w-full max-w-md mx-auto relative shadow-2xl">
      <Outlet />
      <BottomNav
        activeId={activeTab}
        onNavigate={handleNavigation}
        items={[
          { id: 'tasks', label: 'المهام', icon: 'CheckSquare', href: '/tasks' },
          { id: 'home', label: 'الرئيسية', icon: 'Home', href: '/' },
          { id: 'reports', label: 'التقارير', icon: 'FileText', href: '/reports' },
        ]}
      />
    </div>
  );
}
