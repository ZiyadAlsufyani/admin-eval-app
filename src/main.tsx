import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/auth/AuthProvider'
import { get, set } from 'idb-keyval'

// --- ANDROID OOM PRE-BOOT INTERCEPTOR ---
// Catches file picker selections before React has mounted its event listeners.
const globalInput = document.getElementById('global-mobile-file-input') as HTMLInputElement;
if (globalInput) {
  globalInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const rawFile = target.files?.[0];
    const categoryId = localStorage.getItem('pendingUploadCategory');
    const idbKey = localStorage.getItem('currentUploadIdbKey');

    if (rawFile && categoryId && idbKey) {
      try {
        // Initialize or fetch the EvaluationDraft shape
        const existingData = (await get(idbKey)) || { ratings: {}, notes: '', pendingUploads: {} };
        // Safety: migrate old drafts that lacked the pendingUploads wrapper
        if (!existingData.pendingUploads) existingData.pendingUploads = {};
        const categoryFiles = existingData.pendingUploads[categoryId] || [];
        categoryFiles.push({ file: rawFile });
        existingData.pendingUploads[categoryId] = categoryFiles;
        await set(idbKey, existingData);
        localStorage.removeItem('pendingUploadCategory');
        localStorage.removeItem('currentUploadIdbKey');
        target.value = '';
      } catch (err) {
        console.error('Pre-boot interceptor failed:', err);
      }
    }
  });
}
// ----------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 mins
      gcTime: 1000 * 60 * 60 * 24, // Keep data in memory for 24 hours to prevent PWA loading spinners
      refetchOnWindowFocus: true, // Only fetch silently in the background
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
