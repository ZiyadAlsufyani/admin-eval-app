import { useRegisterSW } from 'virtual:pwa-register/react';


export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) return;
      console.log('SW Registered:', r);
      
      // Periodic check every hour
      setInterval(() => {
        r.update();
      }, 3600000);

      // Visibility check
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update();
        }
      });
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div 
      className="fixed bottom-24 right-6 left-6 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300" 
      dir="rtl"
    >
      <div id="toast-interactive" className="w-full max-w-xs p-4 text-secondary bg-surface-container-high rounded-2xl shadow-2xl border border-outline-variant/30" role="alert">
        <div className="flex items-start">
          <div className="inline-flex items-center justify-center shrink-0 w-10 h-10 text-vertex-teal bg-vertex-teal/20 rounded-xl">
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/>
            </svg>
          </div>
          <div className="ms-3 text-sm font-normal">
            <span className="mb-1 text-base font-bold text-on-surface block">تحديث متوفر</span>
            <div className="mb-4 text-secondary leading-relaxed">إصدار جديد من التطبيق متوفر للتحميل الآن.</div> 
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setNeedRefresh(false)}
                className="px-3 py-2 text-secondary bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors text-sm font-medium"
              >
                ليس الآن
              </button>
              <button 
                type="button" 
                onClick={() => updateServiceWorker(true)}
                className="inline-flex items-center justify-center bg-vertex-teal text-white px-3 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-all text-sm"
              >
                <svg className="w-3.5 h-3.5 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"/>
                </svg>
                تحديث
              </button> 
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
}
