import { useParams, useNavigate } from 'react-router-dom';
import { useStaffQuery } from '@/api/staff';
import { Icon } from '@/components/ui/icon';
import { AppHeader } from '@/components/layout/AppHeader';

export default function StaffProfileScreen() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { data: staffList = [], isLoading } = useStaffQuery();

  const staff = staffList.find(s => s.id === staffId);

  if (isLoading) {
    return <div className="p-8 text-center bg-surface min-h-screen text-primary font-bold">جاري التحميل...</div>;
  }

  if (!staff) {
    return (
      <div className="p-8 text-center bg-surface min-h-screen flex flex-col justify-center">
        <p className="text-secondary mb-4">هذا الموظف غير موجود</p>
        <button className="text-primary font-bold" onClick={() => navigate('/staff')}>العودة</button>
      </div>
    );
  }

  // Calculate random trending mock data for visual showcase matching prototype
  const grade = staff.metrics.discipline.score;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 font-body" dir="rtl">
      {/* Top App Bar - Fixed Back Button & Notification */}
      <AppHeader
        title="ملف الموظف"
        actions={
          <button 
            onClick={() => navigate('/staff')}
            className="text-secondary hover:bg-surface-container transition-colors p-2 rounded-xl active:scale-95 duration-200"
          >
            <Icon name="ArrowRight" size={24} />
          </button>
        }
      />

      <main className="pt-6 px-4 max-w-lg mx-auto space-y-6">
        {/* Profile Header Section */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(11,28,48,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-surface-container-high flex items-center justify-center flex-shrink-0">
              {staff.avatarUrl ? (
                <img className="w-full h-full object-cover" src={staff.avatarUrl} alt={staff.name} />
              ) : (
                <span className="text-3xl text-primary font-bold">{staff.name.charAt(0)}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-on-surface font-headline tracking-tight">{staff.name}</h2>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  نشط
                </span>
              </div>
              <p className="text-secondary text-sm font-medium">{staff.role}</p>
              
              <div className="mt-3 flex gap-2">
                <div className="flex items-center gap-1 text-[11px] text-outline px-2 py-1 bg-surface-container rounded-lg">
                  <Icon name="Calendar" size={12} />
                  <span>انضم 2024</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-outline px-2 py-1 bg-surface-container rounded-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-yellow-400/20 translate-y-full group-hover:translate-y-0 transition-transform"/>
                  <span className="text-yellow-600">★</span>
                  <span>4.8 التقييم</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Chart Mock Section */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-on-surface font-headline">اتجاه الأداء</h3>
            <span className="text-[10px] text-secondary font-medium px-2 py-1 bg-surface-container rounded-lg">
              فصل دراسي - 12 أسبوع
            </span>
          </div>
          
          <div className="h-48 w-full relative mt-4 group">
            {/* Simple SVG Line Chart Ported From Stitch */}
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2fab99" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#2fab99" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,120 Q50,110 100,80 T200,60 T300,40 T400,30 V150 H0 Z" fill="url(#chartFill)"></path>
              <path d="M0,120 Q50,110 100,80 T200,60 T300,40 T400,30" fill="none" stroke="#2fab99" strokeLinecap="round" strokeWidth="3" className="transition-all duration-1000 origin-left scale-x-100 group-hover:stroke-teal-600"></path>
              <circle cx="100" cy="80" fill="white" r="4" stroke="#2fab99" strokeWidth="2" className="transition-all hover:r-6"></circle>
              <circle cx="200" cy="60" fill="white" r="4" stroke="#2fab99" strokeWidth="2" className="transition-all hover:r-6"></circle>
              <circle cx="300" cy="40" fill="white" r="4" stroke="#2fab99" strokeWidth="2" className="transition-all hover:r-6"></circle>
              <circle cx="400" cy="30" fill="#2fab99" r="4" className="animate-pulse"></circle>
            </svg>
            <div className="flex justify-between mt-4 text-[10px] text-outline font-medium px-1">
              <span>أسبوع 1</span>
              <span>أسبوع 4</span>
              <span>أسبوع 8</span>
              <span>أسبوع 12</span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-around border-t border-outline-variant/10 pt-4">
            <div className="text-center">
              <p className="text-[10px] text-secondary mb-1">نسبة التقييم الأخير</p>
              <p className="text-lg font-bold text-primary">{grade}%</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/20 self-center"></div>
            <div className="text-center cursor-pointer hover:bg-surface-container rounded-lg px-2 transition-colors">
              <p className="text-[10px] text-secondary mb-1">المتوسط</p>
              <p className="text-lg font-bold text-on-surface">92%</p>
            </div>
          </div>
        </section>

        {/* Evaluations History List  */}
        <section className="space-y-4 pb-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-on-surface font-headline">التقييمات السابقة</h3>
            <button className="text-primary text-[11px] font-bold hover:underline">عرض الكل</button>
          </div>
          
          <div className="space-y-3">
            {[ 
              { title: 'الأسبوع 12 - نهائي', date: 'اليوم', score: grade, id: 1 },
              { title: 'الأسبوع 8 - مراجعة', date: 'الشهر الماضي', score: Math.max(grade - 5, 0), id: 2 } 
            ].map((evalItem) => (
              <div key={evalItem.id} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon name="FileText" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{evalItem.title}</p>
                    <p className="text-[10px] text-secondary">{evalItem.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface">{evalItem.score}/100</p>
                    <p className="text-[10px] text-outline">مكتمل</p>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container text-secondary hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm border border-transparent hover:border-primary">
                    <Icon name="Download" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
