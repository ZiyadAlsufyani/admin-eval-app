import { useLivePerformance } from '@/features/dashboard/useLivePerformance';
import { Icon } from '@/components/ui/icon';

export default function PendingEvaluationsScreen() {
  const { staffList } = useLivePerformance();

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
            <div className="bg-white/20 p-3 rounded-lg relative z-10">
              <Icon name="FileClock" size={24} className="text-white" />
            </div>
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

        {/* Main List Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground">قائمة الموظفين</h3>
            <span className="text-vertex-teal text-sm font-semibold cursor-pointer">عرض الكل</span>
          </div>

          <div className="space-y-4">
            {staffList.filter(s => s.status).map((staff) => {
              const isLate = staff.status === 'متأخر';
              const isToday = staff.status === 'اليوم';

              const badgeColor = isLate
                ? 'text-red-600 bg-red-500/10'
                : isToday
                ? 'text-vertex-teal bg-vertex-teal/10'
                : 'text-secondary bg-surface-container';

              const indicatorColor = isLate ? 'bg-red-500' : isToday ? 'bg-vertex-teal' : 'bg-secondary';

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
                    {isToday ? (
                      <button className="bg-surface-container hover:bg-surface-container-high text-foreground px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all">
                        إكمال النموذج
                      </button>
                    ) : (
                      <button className="bg-vertex-teal hover:bg-vertex-teal/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-vertex-teal/20 active:scale-95 transition-all">
                        بدء التقييم
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
