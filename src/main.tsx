import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/auth/AuthProvider'
import { get, set } from 'idb-keyval'
import { compressImageIfNeeded, MAX_FILE_SIZE_MB, MAX_FILES_PER_CATEGORY } from './api/storage'

// --- ANDROID OOM PRE-BOOT INTERCEPTOR ---
// Catches file picker selections before React has mounted its event listeners.
const globalInput = document.getElementById('global-mobile-file-input') as HTMLInputElement;
if (globalInput) {
  globalInput.addEventListener('change', async (e) => {
    // If the React component is actively mounted (e.g. on Windows or iOS where the app isn't killed),
    // skip the interceptor so we don't double-process the file.
    if ((window as any).isEvaluationFormMounted || (window as any).isStaffPortfolioMounted) return;

    const target = e.target as HTMLInputElement;
    const rawFile = target.files?.[0];
    const categoryId = localStorage.getItem('pendingUploadCategory');
    const idbKey = localStorage.getItem('currentUploadIdbKey');

    const portfolioType = localStorage.getItem('portfolioUploadType');
    const portfolioEntryId = localStorage.getItem('portfolioUploadEntryId');
    const portfolioIdbKey = localStorage.getItem('portfolioUploadIdbKey');

    if (rawFile && categoryId && idbKey) {
      try {
        // Initialize or fetch the EvaluationDraft shape
        const existingData = (await get(idbKey)) || { ratings: {}, notes: '', pendingUploads: {} };
        // Safety: migrate old drafts that lacked the pendingUploads wrapper
        if (!existingData.pendingUploads) existingData.pendingUploads = {};
        const categoryFiles = existingData.pendingUploads[categoryId] || [];
        
        if (categoryFiles.length >= MAX_FILES_PER_CATEGORY) {
          setTimeout(() => {
            alert(`الحد الأقصى هو ${MAX_FILES_PER_CATEGORY} مرفقات لكل قسم.`);
          }, 10);
          return;
        }

        const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        const file = await compressImageIfNeeded(rawFile, MAX_SIZE_BYTES);

        if (file.size > MAX_SIZE_BYTES) {
          const actualSizeMB = (file.size / 1024 / 1024).toFixed(2);
          setTimeout(() => {
            alert(`حجم الملف (${actualSizeMB} ميجابايت) يتجاوز الحد الأقصى وهو ${MAX_FILE_SIZE_MB} ميجابايت.`);
          }, 10);
          return;
        }

        categoryFiles.push({ file });
        existingData.pendingUploads[categoryId] = categoryFiles;
        await set(idbKey, existingData);
      } catch (err) {
        console.error('Pre-boot interceptor failed:', err);
      } finally {
        localStorage.removeItem('pendingUploadCategory');
        localStorage.removeItem('currentUploadIdbKey');
        target.value = '';
      }
    } else if (rawFile && portfolioType && portfolioEntryId && portfolioIdbKey) {
      try {
        const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        const file = await compressImageIfNeeded(rawFile, MAX_SIZE_BYTES);

        if (file.size > MAX_SIZE_BYTES) {
          const actualSizeMB = (file.size / 1024 / 1024).toFixed(2);
          setTimeout(() => {
            alert(`حجم الملف (${actualSizeMB} ميجابايت) يتجاوز الحد الأقصى وهو ${MAX_FILE_SIZE_MB} ميجابايت.`);
          }, 10);
          return;
        }

        const existingData = (await get(portfolioIdbKey)) || { profDevEntries: [], certificateEntries: [] };
        
        if (portfolioType === 'course') {
          const exists = existingData.profDevEntries.some((e: any) => e.id === portfolioEntryId);
          if (exists) {
            existingData.profDevEntries = existingData.profDevEntries.map((e: any) => 
              e.id === portfolioEntryId ? { ...e, pendingFile: file, previewUrl: null } : e
            );
          } else {
            existingData.profDevEntries.push({
              id: portfolioEntryId,
              name: '',
              role: '',
              hours: '',
              pendingFile: file,
              previewUrl: null
            });
          }
        } else {
          const exists = existingData.certificateEntries.some((e: any) => e.id === portfolioEntryId);
          if (exists) {
            existingData.certificateEntries = existingData.certificateEntries.map((e: any) => 
              e.id === portfolioEntryId ? { ...e, pendingFile: file, previewUrl: null } : e
            );
          } else {
            existingData.certificateEntries.push({
              id: portfolioEntryId,
              name: '',
              pendingFile: file,
              previewUrl: null
            });
          }
        }
        await set(portfolioIdbKey, existingData);
      } catch (err) {
        console.error('Portfolio pre-boot interceptor failed:', err);
      } finally {
        localStorage.removeItem('portfolioUploadType');
        localStorage.removeItem('portfolioUploadEntryId');
        localStorage.removeItem('portfolioUploadIdbKey');
        target.value = '';
      }
    }
  });
}
// ----------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute.
      staleTime: 1000 * 60, 
      
      // Data will remain in cache for 30 minutes before being garbage collected
      gcTime: 1000 * 60 * 30, 
      
      // Refetch on mount to ensure freshness, combined with Stale-While-Revalidate
      refetchOnMount: true, 
      
      // Refetch on window focus
      refetchOnWindowFocus: true, 
      
      // Retry failed requests fewer times to prevent long hanging spinners
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
