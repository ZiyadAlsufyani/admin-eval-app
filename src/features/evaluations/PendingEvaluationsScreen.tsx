import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { getTermWeeks } from '@/utils/academicCalendar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';

export default function PendingEvaluationsScreen() {
  const { staffList, selectedEvaluationWeek, setSelectedEvaluationWeek, academicContext, currentAcademicContext, holidays } = useOutletContext<StaffOutletContext>();
  const navigate = useNavigate();
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  
  const recentWeeks = currentAcademicContext 
    ? getTermWeeks(currentAcademicContext.activeTerm, currentAcademicContext.weekNumber, holidays)
    : (academicContext ? getTermWeeks(academicContext.activeTerm, academicContext.weekNumber, holidays) : []);

  // Stats calculation
  const totalPending = staffList.filter(s => s.status === 'معلق' || s.status === 'مسودة').length;

  return (
    <div className="bg-surface text-foreground min-h-screen pb-24 font-sans" dir="rtl">
      
      <AppHeader
        title="التقييمات المعلقة"
        actions={
          <button aria-label="الإشعارات" className="text-vertex-teal p-2 hover:bg-vertex-teal/10 rounded-full transition-transform active:scale-95 duration-200">
            <Icon name="Bell" size={24} />
          </button>
        }
      />

      <main className="px-6 pt-4 space-y-6">
        
        {(!academicContext || academicContext.isHoliday) ? (
          <div className="text-center p-8 mt-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <Icon name="Calendar" size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
            <p className="text-secondary font-medium text-lg">
              {!academicContext ? "لا توجد تقييمات حالية. إجازة سعيدة!" : "هذا الأسبوع يوافق إجازة رسمية. إجازة سعيدة!"}
            </p>
            {recentWeeks.length > 0 && (
              <button 
                onClick={() => setIsWeekPickerOpen(true)}
                className="mt-6 px-6 py-2.5 bg-vertex-teal text-white rounded-xl hover:bg-vertex-teal/90 transition-colors font-bold shadow-md shadow-vertex-teal/20"
              >
                اختر أسبوعاً آخر
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <section className="space-y-3">
              {/* Top Green Card */}
              <div className="bg-vertex-teal p-6 rounded-xl flex justify-between items-center overflow-hidden relative shadow-lg">
                <div className="relative z-10 flex flex-col gap-1">
                  <p className="text-white/80 text-sm font-medium">
                    {academicContext.activeTerm.academic_year} | {academicContext.activeTerm.name}
                  </p>
                  <h2 className="text-4xl font-extrabold text-white tracking-tight">
                    الأسبوع {academicContext.weekNumber}
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
              
              {/* Single white card for pending metric */}
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container flex justify-between items-center">
                <p className="text-secondary font-bold text-lg">إجمالي التقييمات المعلقة</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-vertex-teal">
                    {String(totalPending).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center mb-6 mt-4">
                <h3 className="text-lg font-bold text-foreground">قائمة الموظفين</h3>
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
                      <Avatar 
                        name={staff.name} 
                        imageUrl={staff.avatarUrl} 
                        shape="square" 
                        size="md" 
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

                  <div className="flex items-center justify-end pt-3 border-t border-surface-container/50">
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
        </>
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
