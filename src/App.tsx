import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './features/dashboard/DashboardScreen';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 
        Future Auth Guard Layout should wrap here:
        e.g., <AuthProvider> ... <ProtectedRoute> ... 
      */}
      <BrowserRouter>
        <Routes>
          {/* Main Mobile App */}
          <Route path="/" element={<DashboardScreen />} />
          
          {/* Future auth routes can be placed here */}
          {/* <Route path="/login" element={<LoginScreen />} /> */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
