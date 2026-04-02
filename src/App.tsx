import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './features/dashboard/DashboardScreen';
import { MobileLayout } from './components/layout/MobileLayout';
import PendingEvaluationsScreen from './features/evaluations/PendingEvaluationsScreen';
import EvaluationFormScreen from './features/evaluations/EvaluationFormScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/" element={<DashboardScreen />} />
          <Route path="/tasks" element={<PendingEvaluationsScreen />} />
          <Route path="/evaluate/:staffId" element={<EvaluationFormScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
