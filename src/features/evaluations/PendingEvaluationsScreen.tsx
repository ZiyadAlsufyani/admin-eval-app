import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { getTermWeeks } from '@/utils/academicCalendar';

export default function PendingEvaluationsScreen() {
  const { staffList, selectedEvaluationWeek, setSelectedEvaluationWeek, academicContext } = useOutletContext<StaffOutletContext>();
  const navigate = useNavigate();
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  
  const recentWeeks = academicContext 
    ? getTermWeeks(academicContext.activeTerm, academicContext.weekNumber)
    : [];

  // Stats calculation
  const totalPending = staffList.filter(s => s.status === 'معلق' || s.status === 'متأخر').length;
  const dueToday = staffList.filter(s => s.status === 'اليوم').length;
  const late = staffList.filter(s => s.status === 'متأخر').length;

  return (
    <div className="bg-surface text-foreground min-h-screen pb-24 font-sans" dir="rtl">
      
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-surface/90 backdrop-blur-md border-none flex flex-row-reverse justify-between items-center px-6 py-4 pt-safe h-16">
        <div className="flex items-center gap-3">
          <button aria-label="الإشعارات" className="text-vertex-teal p-2 hover:bg-vertex-teal/10 rounded-full transition-transform active:scale-95 duration-200">
            <Icon name="Bell" size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-foreground">التقييمات المعلقة</h1>
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border-2 border-vertex-teal">
          <img 
            className="w-full h-full object-cover" 
            alt="User Avatar" 
            src="https://i.ibb.co/Rk028yp0/Gemini-Generated-Image-koaeh9koaeh9koae.png"
          />
        </div>
      </header>

      <main className="px-6 pt-4 space-y-6">
        
        {/* Summary Section: Editorial Bento Style */}
        <section className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-vertex-teal p-5 rounded-xl flex justify-between items-end overflow-hidden relative shadow-lg">
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium">إجمالي المعلق</p>
              <h2 className="text-4xl font-extrabold text-white tracking-tight mt-1">
                {String(totalPending).padStart(2, '0')}
              </h2>
            </div>
            <button 
              onClick={() => setIsWeekPickerOpen(true)}
              className="bg-white/20 p-3 rounded-lg relative z-10 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              aria-label="اختيار الأسبوع"
            >
              <Icon name="Calendar" size={24} className="text-white" />
            </button>
            {/* Soft decorative blur inside the main bento box */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container">
            <p className="text-secondary text-xs font-medium mb-1">مستحق اليوم</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-vertex-teal">
                {String(dueToday).padStart(2, '0')}
              </span>
              <span className="w-2 h-2 rounded-full bg-vertex-teal"></span>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container">
            <p className="text-secondary text-xs font-medium mb-1">متأخر</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-500">
                {String(late).padStart(2, '0')}
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            </div>
          </div>
        </section>

        {!academicContext ? (
          <div className="text-center p-8 mt-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <Icon name="Calendar" size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
            <p className="text-secondary font-medium text-lg">لا توجد تقييمات حالية. إجازة سعيدة!</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">قائمة الموظفين</h3>
              <span className="text-vertex-teal text-sm font-semibold cursor-pointer">عرض الكل</span>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant/20">
              <span className="text-xs font-bold text-secondary">{academicContext.activeTerm.academic_year}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-xs font-bold text-secondary">{academicContext.activeTerm.name}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-xs font-bold text-vertex-teal">الأسبوع {academicContext.weekNumber}</span>
            </div>

            <div className="space-y-4">
            {staffList.filter(s => s.status).map((staff) => {
              const isCompleted = staff.status === 'مكتمل';
              const isDraft = staff.status === 'مسودة';

              const badgeColor = isCompleted
                ? 'text-vertex-teal bg-vertex-teal/10'
                : isDraft
                ? 'text-amber-600 bg-amber-500/10'
                : 'text-secondary bg-surface-container';

              const indicatorColor = isCompleted ? 'bg-vertex-teal' : isDraft ? 'bg-amber-500' : 'bg-secondary';

              return (
                <div key={staff.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-[0px_12px_32px_rgba(0,0,0,0.03)] border border-surface-container space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        className="w-14 h-14 rounded-xl object-cover border border-surface-container" 
                        alt={staff.name} 
                        src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${staff.name}&background=random`} 
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${indicatorColor} rounded-full border-2 border-white`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground text-base">{staff.name}</h4>
                      <div className="flex items-center gap-2 text-secondary text-sm">
                        <Icon name="BookOpen" size={14} />
                        <span>{staff.subject || staff.role}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
                        {staff.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-surface-container/50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-secondary/70 uppercase tracking-wider font-semibold">تاريخ الاستحقاق</span>
                      <span className="text-[13px] font-bold text-foreground">{staff.dueDate}</span>
                    </div>
                    {staff.isDraft ? (
                      <button 
                        onClick={() => navigate(`/evaluate/${staff.id}`)}
                        className="bg-surface-container hover:bg-surface-container-high text-foreground px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all">
                        إكمال النموذج
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/evaluate/${staff.id}`)}
                        className="bg-vertex-teal hover:bg-vertex-teal/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-vertex-teal/20 active:scale-95 transition-all">
                        بدء التقييم
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}
      </main>

      {/* Week Picker Modal */}
      {isWeekPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsWeekPickerOpen(false)}>
          <div 
            className="bg-surface w-full max-w-md rounded-t-2xl p-6 shadow-2xl pb-safe border-t border-surface-container animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">اختر أسبوع التقييم</h3>
              <button 
                onClick={() => setIsWeekPickerOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container text-secondary transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="space-y-2 pb-8 max-h-[60vh] overflow-y-auto">
              {recentWeeks.map((week, idx) => {
                // simple comparison by time
                const isSelected = week.start.getTime() === selectedEvaluationWeek.getTime();
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEvaluationWeek(week.start);
                      setIsWeekPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-vertex-teal/10 border-vertex-teal text-vertex-teal border' 
                        : 'bg-surface-container hover:bg-surface-container-high text-foreground border border-transparent'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-right">{week.label}</span>
                      <span className="text-xs text-secondary text-right block">{week.shortFormat}</span>
                    </div>
                    {isSelected && <Icon name="CheckCircle2" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
