import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import { supabase } from '@/lib/supabase';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DashboardScreen() {
  const { staffList, academicContext } = useOutletContext<StaffOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Derived Statistics from arbitrary number of staff
  const staffCount = staffList.length;
  const avgDiscipline = Math.round(
    staffList.reduce((acc, curr) => acc + curr.metrics.discipline.score, 0) / (staffCount || 1)
  );
  
  // Calculate a 5-point scale rating (e.g. 88% -> 4.4)
  const avgRating = (avgDiscipline / 20).toFixed(1);

  // Compute pending items (Mock logic: staff with score < 85 need follow up)
  const pendingCount = staffList.filter((s) => s.metrics.competencies.score < 85).length;

  return (
    <div className="bg-surface text-foreground min-h-screen pb-24 font-sans" dir="rtl">
      
      {/* Stitch Header */}
      <header className="w-full top-0 sticky bg-surface flex flex-row-reverse justify-between items-center px-6 py-4 h-16 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container border-2 border-vertex-teal">
            <img 
              alt="User Avatar" 
              className="w-full h-full object-cover" 
              src="https://i.ibb.co/Rk028yp0/Gemini-Generated-Image-koaeh9koaeh9koae.png" 
            />
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              queryClient.clear();
            }}
            aria-label="تسجيل الخروج" 
            className="text-error p-2 hover:bg-error/10 rounded-full transition-transform active:scale-95 duration-200"
          >
            <Icon name="LogOut" size={24} />
          </button>
        </div>
        <div className="flex flex-col items-end">
          <h1 className="text-xl font-extrabold text-vertex-teal tracking-tight">{profile?.full_name || 'المدير'}</h1>
        </div>
      </header>

      <main className="px-5 pt-2 space-y-6">
        
        {/* Urgent Actions Hero Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-foreground">إجراءات عاجلة</h2>
          </div>
          <div className="bg-vertex-teal text-white p-6 rounded-xl shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="z-10">
              <span className="text-xs font-medium opacity-90 block mb-1">التقييمات المعلقة</span>
              <span className="text-4xl font-black block">{pendingCount}</span>
              <button 
                onClick={() => navigate('/tasks')}
                className="mt-4 bg-white text-vertex-teal px-4 py-2 rounded-lg text-xs font-extrabold shadow-md active:scale-95 transition-transform"
              >
                ابدأ التقييم الآن
              </button>
            </div>
            {/* Background Icon */}
            <Icon name="Clock" size={120} className="text-white/20 absolute -left-4 -bottom-4" />
          </div>
        </section>

        {/* Academic Context Indicator */}
        {academicContext && (
          <section className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full border border-surface-container shadow-sm">
              <Icon name="Calendar" size={16} className="text-vertex-teal" />
              <span className="text-xs font-bold text-vertex-teal">{academicContext.activeTerm.academic_year}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-xs font-bold text-secondary">{academicContext.activeTerm.name}</span>
            </div>
          </section>
        )}

        {/* Statistical Summary Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 shadow-sm border border-surface-container">
            <Icon name="BarChart" size={24} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-secondary leading-tight">الأداء العام</span>
              <span className="text-lg font-bold text-primary">{avgDiscipline}%</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 shadow-sm border border-surface-container">
            <Icon name="Star" size={24} className="text-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-secondary leading-tight">متوسط التقييم</span>
              <span className="text-lg font-bold text-foreground">{avgRating}</span>
            </div>
          </div>
        </section>

        {/* Live Performance Tracking List */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-foreground">أداء يحتاج إلى متابعة</h2>
            <span className="text-[10px] font-bold text-vertex-teal cursor-pointer hover:underline">عرض سجل الأداء</span>
          </div>
          
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container">
            <div className="space-y-4">
              {staffList.map((staff) => {
                const score = staff.metrics.discipline.score;
                
                // Dynamic Range Logic
                const isCritical = score < 60;
                const isWarning = score >= 60 && score < 75;
                const isGood = score >= 75 && score < 85;

                // Derive specific color tailwind classes
                const wrapClass = isCritical ? 'bg-orange-50 -mx-2 p-2 rounded-lg' : isWarning ? 'bg-warning-bg -mx-2 p-2 rounded-lg' : '';
                const barColor = isCritical ? 'bg-orange-500' : isWarning ? 'bg-warning-soft' : isGood ? 'bg-vertex-teal' : 'bg-primary';
                const textClass = isCritical ? 'text-orange-600' : isWarning ? 'text-warning-soft' : 'text-secondary';
                
                return (
                  <div key={staff.id} className={`flex items-center gap-3 transition-colors duration-500 ${wrapClass}`}>
                    <span className="text-[11px] font-bold text-foreground w-12 text-right truncate">
                      {staff.name.split(' ')[0]}
                    </span>
                    <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} 
                        style={{ width: `${score}%` }} 
                      />
                    </div>
                    
                    {/* Right side metrics & alerts */}
                    <div className="flex items-center gap-1 w-12 justify-end">
                      <span className={`text-[11px] font-bold transition-colors duration-500 ${textClass}`}>
                        {score}%
                      </span>
                      {(isCritical || isWarning) && (
                        <Icon 
                          name={isCritical ? "AlertTriangle" : "AlertCircle"} 
                          size={14} 
                          className={textClass} 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
