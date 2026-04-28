import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from '@/components/ui/icon';

export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-24 right-6 left-6 z-[100] bg-surface-container-high border border-vertex-teal shadow-2xl rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-5 duration-300" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="bg-vertex-teal/20 p-2 rounded-full text-vertex-teal">
          <Icon name="RefreshCw" size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground">تحديث جديد متوفر</span>
          <span className="text-sm text-secondary">انقر للتحديث للحصول على أحدث الميزات</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setNeedRefresh(false)} 
          className="px-3 py-2 text-secondary hover:bg-surface-container rounded-lg transition-colors text-sm font-medium"
        >
          تجاهل
        </button>
        <button 
          onClick={() => updateServiceWorker(true)} 
          className="bg-vertex-teal text-white px-4 py-2 rounded-lg font-bold shadow-md active:scale-95 transition-all text-sm"
        >
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
