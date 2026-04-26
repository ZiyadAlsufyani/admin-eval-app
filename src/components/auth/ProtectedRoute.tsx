import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function ProtectedRoute() {
  const { session, profile, school, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-bold text-primary">
        جاري تهيئة النظام...
      </div>
    );
  }

  // Not Authenticated -> Redirect to Login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Quarantine Logic: Principals in a pending school MUST be sent to the Waiting Room
  if (profile?.role === 'principal' && school?.status === 'pending') {
    if (location.pathname !== '/waiting-room') {
      return <Navigate to="/waiting-room" replace />;
    }
    // If they are explicitly allowed on the waiting room, let Outlet render
    return <Outlet />;
  }

  // If a pending Principal explicitly tried navigating away from waiting room, above caught it.
  // Below applies to active principals or staff:
  
  if (location.pathname === '/waiting-room') {
    // If they are no longer pending but somehow on the waiting room, shoot them back to root
    return <Navigate to="/" replace />;
  }

  // Role-Based Entry Routing
  if (location.pathname === '/') {
    if (profile?.role === 'principal') return <Navigate to="/admin-dashboard" replace />;
    if (profile?.role === 'staff') return <Navigate to="/staff-dashboard" replace />;
  }

  // Enforce isolation between roles
  const principalRoutes = ['/admin-dashboard', '/staff', '/tasks', '/evaluate'];
  const staffRoutes = ['/staff-dashboard'];

  const isPrincipalRoute = principalRoutes.some(route => location.pathname === route || location.pathname.startsWith(`${route}/`));
  const isStaffRoute = staffRoutes.some(route => location.pathname === route || location.pathname.startsWith(`${route}/`));

  if (profile?.role === 'staff' && isPrincipalRoute) {
    return <Navigate to="/staff-dashboard" replace />;
  }

  if (profile?.role === 'principal' && isStaffRoute) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Outlet />;
}
