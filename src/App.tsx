import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './features/dashboard/DashboardScreen';
import { MobileLayout } from './components/layout/MobileLayout';
import PendingEvaluationsScreen from './features/evaluations/PendingEvaluationsScreen';
import EvaluationFormScreen from './features/evaluations/EvaluationFormScreen';
import EvaluationDetailScreen from './features/evaluations/EvaluationDetailScreen';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginScreen } from './features/auth/LoginScreen';
import SignUpScreen from './features/auth/SignUpScreen';
import StaffSignUpScreen from './features/auth/StaffSignUpScreen';
import StaffManagementScreen from './features/staff/StaffManagementScreen';
import StaffProfileScreen from './features/staff/StaffProfileScreen';
import StaffPortfolioScreen from './features/staff/StaffPortfolioScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/signup/staff" element={<StaffSignUpScreen />} />
        
        {/* Protected SaaS Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={null} /> {/* Handled by ProtectedRoute redirection */}
          
          <Route element={<MobileLayout />}>
            <Route path="/admin-dashboard" element={<DashboardScreen />} />
            <Route path="/staff-dashboard" element={<DashboardScreen />} />
            <Route path="/staff-profile" element={<StaffProfileScreen />} />
            <Route path="/staff-portfolio" element={<StaffPortfolioScreen />} />
            <Route path="/staff" element={<StaffManagementScreen />} />
            <Route path="/staff/:staffId" element={<StaffProfileScreen />} />
            <Route path="/tasks" element={<PendingEvaluationsScreen />} />
            <Route path="/evaluate/:staffId" element={<EvaluationFormScreen />} />
            <Route path="/evaluations/:evaluationId" element={<EvaluationDetailScreen />} />
          </Route>
          
          <Route path="/waiting-room" element={<div className="min-h-screen bg-surface flex flex-col justify-center items-center text-center p-8"><h1 className="text-2xl font-bold text-primary mb-4">في انتظار موافقة الإدارة</h1><p className="text-on-surface-variant font-light">مدرستك حالياً قيد المراجعة والتدقيق. سيتم تفعيل حسابك بمجرد الانتهاء.</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
