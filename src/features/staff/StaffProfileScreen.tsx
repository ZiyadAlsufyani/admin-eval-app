import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useStaffQuery } from '@/api/staff';
import { useStaffEvaluationsHistoryQuery } from '@/api/evaluations';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { Icon } from '@/components/ui/icon';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';

function sampleChartData<T>(data: T[], maxPoints = 6): T[] {
  if (data.length <= maxPoints) return data;
  const step = (data.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => data[Math.round(i * step)]);
}

export default function StaffProfileScreen() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { data: staffList = [], isLoading } = useStaffQuery();
  const { academicContext } = useOutletContext<StaffOutletContext>();
  const { data: historyData = [] } = useStaffEvaluationsHistoryQuery(staffId, academicContext?.activeTerm?.academic_year);
  const [activePoint, setActivePoint] = useState<number | null>(null);

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

  // Use the latest score for the top card, fallback to 0
  const latestEvaluation = historyData[0];
  const grade = latestEvaluation?.overall_score_percentage || 0;
  
  // Calculate average
  const avgDiscipline = historyData.length > 0 
    ? Math.round(historyData.reduce((acc, curr) => acc + (curr.overall_score_percentage || 0), 0) / historyData.length) 
    : 0;

  const joinYear = staff.created_at ? new Date(staff.created_at).getFullYear() : new Date().getFullYear();
  const starRating = avgDiscipline > 0 ? (avgDiscipline / 20).toFixed(1) : "0.0";

  const TOP_PADDING = 20;
  const RIGHT_TEXT_PADDING = 30;
  const CHART_WIDTH = 400 - RIGHT_TEXT_PADDING;
  const CHART_HEIGHT = 100;

  // Chart data calculations
  const chronologicalData = [...historyData].reverse();
  const displayData = sampleChartData(chronologicalData, 6);
  
  const calculateX = (index: number) => {
    if (displayData.length === 1) return CHART_WIDTH;
    const spacing = CHART_WIDTH / (displayData.length - 1);
    return CHART_WIDTH - (index * spacing);
  };

  const chartPoints = displayData.map((evalItem, i) => {
    const score = evalItem.overall_score_percentage || 0;
    const x = calculateX(i);
    const y = (CHART_HEIGHT - (score / 100) * CHART_HEIGHT) + TOP_PADDING;
    return { x, y, score, week: `أسبوع ${evalItem.academic_week_number || '?'}` };
  });

  const pathStr = displayData.length === 1 
    ? `M0,${CHART_HEIGHT + TOP_PADDING} L${chartPoints[0]?.x},${chartPoints[0]?.y} L${CHART_WIDTH},${CHART_HEIGHT + TOP_PADDING}`
    : chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

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
            <Avatar 
              name={staff.name} 
              imageUrl={staff.avatarUrl} 
              size="lg" 
              shape="square" 
            />
            
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
                  <span>انضم {joinYear}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-outline px-2 py-1 bg-surface-container rounded-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-yellow-400/20 translate-y-full group-hover:translate-y-0 transition-transform"/>
                  <span className="text-yellow-600">★</span>
                  <span>{starRating} التقييم</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Chart Section */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(11,28,48,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-on-surface font-headline">اتجاه الأداء</h3>
            <span className="text-[10px] text-secondary font-medium px-2 py-1 bg-surface-container rounded-lg">
              السنة الدراسية - {academicContext?.activeTerm.academic_year}
            </span>
          </div>
          
          <div className="h-48 w-full relative mt-4 group">
            {historyData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-secondary text-sm font-bold">
                لا توجد بيانات للتقييم بعد
              </div>
            ) : (
              <>
                <svg 
                  className="w-full h-full overflow-visible" 
                  preserveAspectRatio="none" 
                  viewBox="0 0 400 150"
                  onClick={() => setActivePoint(null)}
                >
                  <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2fab99" stopOpacity="0.2"></stop>
                      <stop offset="100%" stopColor="#2fab99" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>

                  {/* Y-Axis Gridlines */}
                  <g className="text-secondary/30">
                    <line x1="0" y1={TOP_PADDING} x2={CHART_WIDTH} y2={TOP_PADDING} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <text x="395" y={TOP_PADDING + 4} textAnchor="end" className="text-[10px] fill-secondary/50 font-bold">100</text>
                    <line x1="0" y1={CHART_HEIGHT/2 + TOP_PADDING} x2={CHART_WIDTH} y2={CHART_HEIGHT/2 + TOP_PADDING} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <text x="395" y={CHART_HEIGHT/2 + TOP_PADDING + 4} textAnchor="end" className="text-[10px] fill-secondary/50 font-bold">50</text>
                    <line x1="0" y1={CHART_HEIGHT + TOP_PADDING} x2={CHART_WIDTH} y2={CHART_HEIGHT + TOP_PADDING} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                    <text x="395" y={CHART_HEIGHT + TOP_PADDING + 4} textAnchor="end" className="text-[10px] fill-secondary/50 font-bold">0</text>
                  </g>
                  
                  <path d={`${pathStr} V${CHART_HEIGHT + TOP_PADDING} H0 Z`} fill="url(#chartFill)"></path>
                  <path d={pathStr} fill="none" stroke="#2fab99" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-all duration-1000 origin-left scale-x-100 group-hover:stroke-teal-600"></path>
                  
                  {chartPoints.map((p, i) => (
                    <g key={i}>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        fill={i === chartPoints.length - 1 ? "#2fab99" : "white"} 
                        r={activePoint === i ? 6 : 4} 
                        stroke="#2fab99" 
                        strokeWidth="2" 
                        className={`transition-all ${i === chartPoints.length - 1 ? 'animate-pulse' : ''}`}
                      />
                      {/* Large invisible touch target */}
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="20" 
                        fill="transparent" 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePoint(i);
                        }}
                      />
                      {/* X-Axis Labels */}
                      <text 
                        x={p.x} 
                        y={TOP_PADDING + CHART_HEIGHT + 20} 
                        textAnchor="middle" 
                        className="fill-secondary text-[10px] font-medium"
                      >
                        {p.week}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Tooltip Layer */}
                {activePoint !== null && chartPoints[activePoint] && (
                  <div 
                    className="absolute z-20 bg-surface-container-high text-on-surface shadow-lg rounded-xl px-3 py-2 text-xs border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200 pointer-events-none flex flex-col items-center gap-0.5"
                    style={{ 
                      left: `${(chartPoints[activePoint].x / 400) * 100}%`,
                      top: `${(chartPoints[activePoint].y / 150) * 100}%`,
                      transform: 'translate(-50%, -120%)'
                    }}
                  >
                    <div className="font-black text-vertex-teal text-sm">{chartPoints[activePoint].score}%</div>
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-wider">{chartPoints[activePoint].week}</div>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-container-high border-r border-b border-outline-variant/30 rotate-45" />
                  </div>
                )}

              </>
            )}
          </div>
          
          <div className="mt-6 flex justify-around border-t border-outline-variant/10 pt-4">
            <div className="text-center">
              <p className="text-[10px] text-secondary mb-1">نسبة التقييم الأخير</p>
              <p className="text-lg font-bold text-primary">{grade}%</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/20 self-center"></div>
            <div className="text-center cursor-pointer hover:bg-surface-container rounded-lg px-2 transition-colors">
              <p className="text-[10px] text-secondary mb-1">المتوسط</p>
              <p className="text-lg font-bold text-on-surface">{avgDiscipline}%</p>
            </div>
          </div>
        </section>

        {/* Evaluations History List  */}
        <section className="space-y-4 pb-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-on-surface font-headline">التقييمات السابقة</h3>
            <button 
              onClick={() => navigate(`/staff/${staff.id}/evaluations`)}
              className="text-primary text-[11px] font-bold hover:underline"
            >
              عرض الكل
            </button>
          </div>
          
          <div className="space-y-3">
            {historyData.length === 0 ? (
              <p className="text-sm text-secondary text-center py-4">لم يتم تقييم هذا الموظف بعد.</p>
            ) : (
              historyData.slice(0, 5).map((evalItem) => (
                <div 
                  key={evalItem.id} 
                  onClick={() => navigate(`/evaluations/${evalItem.id}`)}
                  className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-primary/10 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Icon name="FileText" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">أسبوع {evalItem.academic_week_number}</p>
                      <p className="text-[10px] text-secondary">{new Date(evalItem.week_start_date).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-bold text-on-surface">{evalItem.overall_score_percentage}/100</p>
                      <p className="text-[10px] text-outline">مكتمل</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Downloading PDF for", evalItem.id);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container text-secondary hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm border border-transparent hover:border-primary"
                    >
                      <Icon name="Download" size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
