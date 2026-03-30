
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Mobile-first AppBar */}
        <header className="bg-white border-b border-border p-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">نظام تقييم الإداريين</h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col gap-6">
          <section className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">مرحباً بك في لوحة التقييم</h2>
            <p className="text-slate-500 text-sm">
              التصميم جاهز وسيتم ربط الواجهات باستخدام Stitch MCP قريباً.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-800">8</span>
                <span className="text-xs text-slate-500 mt-1">إداريين للتقييم</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-800">2</span>
                <span className="text-xs text-slate-500 mt-1">أقسام رئيسية</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
