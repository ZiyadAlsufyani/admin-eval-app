import React, { useState } from 'react';
import { useLivePerformance } from './useLivePerformance';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Icon } from '@/components/ui/icon';

export default function DashboardScreen() {
  const { staffList } = useLivePerformance();
  const [activeTab, setActiveTab] = useState('home');

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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiGuKUYyf_EEwt-4NIdfzIac6h49bB2NgG61ORRPCFPl4buQPgkP5rDBir-94lJgWTylG49D_UTM7OdMx0SpJ77R5bjpJVh9YF5bJX6Y5TQSHH2K0yH6OKs6NeqqAvBy_IuoZzEto1NBSHGSmZA5keQLjGVar166Za9TlBfO9eUhoT3Y3I1GBUjd1DlmZi_EUZ5EWtppQPtVHLW98_vIcXML1W2dXqMn1Q1R5oHdHdeLv3lzLK8D04mhAg4xVSR8wVAO8VJsWP1hy1" 
            />
          </div>
          <button aria-label="الإشعارات" className="text-vertex-teal p-2 hover:bg-vertex-teal/10 rounded-full transition-transform active:scale-95 duration-200">
            <Icon name="Bell" size={24} />
          </button>
        </div>
        <div className="flex flex-col items-end">
          <h1 className="text-xl font-extrabold text-vertex-teal tracking-tight">فيرتكس إنسايت</h1>
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
              <button className="mt-4 bg-white text-vertex-teal px-4 py-2 rounded-lg text-xs font-extrabold shadow-md active:scale-95 transition-transform">
                ابدأ التقييم الآن
              </button>
            </div>
            {/* Background Icon */}
            <Icon name="Clock" size={120} className="text-white/20 absolute -left-4 -bottom-4" />
          </div>
        </section>

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

      {/* Glassy Bottom Navigation */}
      <BottomNav
        activeId={activeTab}
        onNavigate={(id) => setActiveTab(id)}
        items={[
          { id: 'tasks', label: 'المهام', icon: 'CheckSquare', href: '#' },
          { id: 'home', label: 'الرئيسية', icon: 'Home', href: '#' },
          { id: 'reports', label: 'التقارير', icon: 'FileText', href: '#' },
        ]}
      />
    </div>
  );
}
