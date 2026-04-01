import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './features/dashboard/DashboardScreen';
import { MobileLayout } from './components/layout/MobileLayout';
import PendingEvaluationsScreen from './features/evaluations/PendingEvaluationsScreen';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/tasks" element={<PendingEvaluationsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
