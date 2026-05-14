import { useState, useMemo } from 'react';
import { useStaffAchievementsQuery, useDeleteAchievementMutation, type StaffAchievement } from '@/api/portfolio';
import { Icon } from '@/components/ui/icon';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

// ─── helpers ────────────────────────────────────────────────────────────────

function getPublicUrl(documentUrl: string | null | undefined): string | null {
  if (!documentUrl) return null;
  const { data } = supabase.storage
    .from('portfolio_documents')
    .getPublicUrl(documentUrl);
  return data.publicUrl;
}

// ─── Bar Chart Types ──────────────────────────────────────────────────────────

interface MonthBarData {
  month: number;
  count: number;
  courseCount: number;
  certCount: number;
}

interface BarChartProps {
  monthCounts: MonthBarData[];
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
//
// Fixed viewBox (300 × 160) scales to 100% container width → no horizontal scroll.
// All 12 fiscal months are always rendered (empty months show no bars).
// Tooltip is an in-chart info panel at the top row to avoid overflow.

const VB_W = 300;
const VB_H = 160;
const PAD = { top: 28, right: 4, bottom: 30, left: 22 };
const CHART_H = VB_H - PAD.top - PAD.bottom; // 102
const CHART_W = VB_W - PAD.left - PAD.right;  // 274
const FISCAL_MONTHS = 12;
const GROUP_W = CHART_W / FISCAL_MONTHS;       // ~22.8 viewBox units per group
const BAR_W = 7;   // width of each bar
const BAR_GAP = 2; // gap between course bar and cert bar within a group

function AchievementsBarChart({ monthCounts }: BarChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Fast O(1) lookup: month number → data
  const dataMap = useMemo(() => {
    const m: Record<number, MonthBarData> = {};
    monthCounts.forEach((d) => { m[d.month] = d; });
    return m;
  }, [monthCounts]);

  if (monthCounts.length === 0) return null;

  const maxCount = Math.max(...monthCounts.map((d) => d.count), 1);
  const gridMax = maxCount <= 4 ? maxCount : Math.ceil(maxCount / 2) * 2;
  const gridStep = gridMax <= 4 ? 1 : gridMax / 4;
  const gridValues: number[] = [];
  for (let v = 0; v <= gridMax; v += gridStep) gridValues.push(v);

  const axisY = PAD.top + CHART_H;
  const selectedData = selectedMonth !== null ? (dataMap[selectedMonth] ?? null) : null;

  return (
    <div dir="ltr">
      <div className="flex gap-2 items-start">

        {/* ── SVG Chart fills all available width ── */}
        <div className="flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            style={{ display: 'block' }}
            aria-label="مخطط الإنجازات الشهرية"
            onClick={(e) => {
              if ((e.target as Element).tagName === 'svg') setSelectedMonth(null);
            }}
          >
            {/* ── Info panel: always at top, never overflows ── */}
            <rect
              x={PAD.left} y={2}
              width={CHART_W} height={PAD.top - 4}
              rx={3}
              fill={selectedData ? '#f0f9ff' : 'transparent'}
            />
            {selectedData ? (
              <text
                x={PAD.left + CHART_W / 2} y={14}
                textAnchor="middle" fontSize={8} fill="#1e293b" fontWeight={700}
              >
                {`الشهر ${selectedMonth}: `}
                <tspan fill="#3b82f6">{selectedData.courseCount} دورة</tspan>
                {' • '}
                <tspan fill="#d97706">{selectedData.certCount} شهادة</tspan>
              </text>
            ) : (
              <text
                x={PAD.left + CHART_W / 2} y={14}
                textAnchor="middle" fontSize={8} fill="#94a3b8"
              >
                اضغط على شريط للتفاصيل
              </text>
            )}

            {/* ── Y-axis gridlines + labels ── */}
            {gridValues.map((val) => {
              const gy = axisY - (val / gridMax) * CHART_H;
              return (
                <g key={val}>
                  <line
                    x1={PAD.left} y1={gy}
                    x2={PAD.left + CHART_W} y2={gy}
                    stroke={val === 0 ? '#cbd5e1' : '#f1f5f9'}
                    strokeWidth={val === 0 ? 1.5 : 1}
                    strokeDasharray={val === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={PAD.left - 4} y={gy + 3.5}
                    textAnchor="end" fontSize={7} fill="#94a3b8" fontWeight={500}
                  >{val}</text>
                </g>
              );
            })}

            {/* ── Y-axis vertical line ── */}
            <line
              x1={PAD.left} y1={PAD.top}
              x2={PAD.left} y2={axisY}
              stroke="#cbd5e1" strokeWidth={1.5}
            />

            {/* ── Side-by-side bars for all 12 months ── */}
            {Array.from({ length: FISCAL_MONTHS }, (_, i) => {
              const month = i + 1;
              const data = dataMap[month] ?? { month, count: 0, courseCount: 0, certCount: 0 };
              const groupX = PAD.left + i * GROUP_W;
              const margin = (GROUP_W - BAR_W * 2 - BAR_GAP) / 2;
              const courseBarX = groupX + margin;
              const certBarX = courseBarX + BAR_W + BAR_GAP;
              const centerX = groupX + GROUP_W / 2;
              const isSelected = selectedMonth === month;

              const courseH = data.courseCount > 0
                ? (data.courseCount / gridMax) * CHART_H : 0;
              const certH = data.certCount > 0
                ? (data.certCount / gridMax) * CHART_H : 0;

              return (
                <g
                  key={month}
                  onClick={() => setSelectedMonth(isSelected ? null : month)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Subtle background track behind both bars */}
                  <rect
                    x={courseBarX} y={PAD.top}
                    width={BAR_W * 2 + BAR_GAP} height={CHART_H}
                    rx={2} fill="#f8fafc"
                  />

                  {/* Course bar — blue */}
                  {courseH > 0 && (
                    <rect
                      x={courseBarX} y={axisY - courseH}
                      width={BAR_W} height={courseH}
                      rx={2}
                      fill={isSelected ? '#2563eb' : '#3b82f6'}
                      style={{ transition: 'fill 0.15s' }}
                    />
                  )}

                  {/* Certificate bar — amber */}
                  {certH > 0 && (
                    <rect
                      x={certBarX} y={axisY - certH}
                      width={BAR_W} height={certH}
                      rx={2}
                      fill={isSelected ? '#d97706' : '#f59e0b'}
                      style={{ transition: 'fill 0.15s' }}
                    />
                  )}

                  {/* Selection underline tick */}
                  {isSelected && (
                    <line
                      x1={centerX - 4} y1={axisY + 3}
                      x2={centerX + 4} y2={axisY + 3}
                      stroke="#1e293b" strokeWidth={1.5} strokeLinecap="round"
                    />
                  )}

                  {/* X-axis month number */}
                  <text
                    x={centerX} y={axisY + 18}
                    textAnchor="middle" fontSize={7}
                    fill={isSelected ? '#1e293b' : '#94a3b8'}
                    fontWeight={isSelected ? 700 : 400}
                  >{month}</text>
                </g>
              );
            })}
          </svg>

          {/* Fiscal month axis label — directly below x-axis */}
          <p className="text-[10px] text-secondary text-center -mt-0.5 mb-1">
            الشهر المالي
          </p>
        </div>

        {/* ── Legend — right side, stacked vertically ── */}
        <div className="shrink-0 flex flex-col gap-3 pt-8">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />
            <span className="text-[10px] text-secondary font-medium">دورات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
            <span className="text-[10px] text-secondary font-medium">شهادات</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Achievement Item ─────────────────────────────────────────────────────────

interface AchievementItemProps {
  item: StaffAchievement;
}

function AchievementItem({ item }: AchievementItemProps) {
  const isCourse = item.type === 'course';
  const publicUrl = getPublicUrl(item.document_url);
  const { profile } = useAuth();
  const { mutate: deleteAchievement, isPending } = useDeleteAchievementMutation();

  const handleDownload = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإنجاز؟ لا يمكن التراجع عن هذه الخطوة.')) {
      if (item.id) {
        deleteAchievement({ achievementId: item.id, documentUrl: item.document_url });
      }
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant/10 last:border-b-0">
      {/* Type icon */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isCourse ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <Icon name={isCourse ? 'BookOpen' : 'Award'} size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface truncate leading-snug">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCourse ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isCourse ? 'دورة تدريبية' : 'شهادة'}
          </span>
          {item.role && (
            <span className="text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded-full">
              {item.role}
            </span>
          )}
          {item.hours != null && (
            <span className="text-[10px] text-secondary flex items-center gap-1">
              <Icon name="Clock" size={10} />
              {item.hours} ساعة
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — mr-auto pushes them to the left in RTL */}
      <div className="mr-auto flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={!publicUrl}
          title={publicUrl ? 'عرض المستند' : 'لا يوجد مستند'}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
            publicUrl
              ? 'bg-surface-container text-vertex-teal hover:bg-vertex-teal hover:text-white shadow-sm border border-outline-variant/20 hover:border-vertex-teal'
              : 'bg-surface-container text-outline/40 cursor-not-allowed'
          }`}
          aria-label="تحميل المستند"
        >
          <Icon name="Download" size={16} />
        </button>

        {profile?.role === 'staff' && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="حذف الإنجاز"
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 shadow-sm border border-outline-variant/20 ${
              isPending
                ? 'opacity-50 cursor-wait bg-surface-container text-red-500'
                : 'bg-surface-container text-red-500 hover:bg-red-50 hover:border-red-200 active:bg-red-100'
            }`}
            aria-label="حذف الإنجاز"
          >
            {isPending ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Icon name="Trash2" size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Month Card ───────────────────────────────────────────────────────────────

interface MonthCardProps {
  month: number;
  achievements: StaffAchievement[];
}

function MonthCard({ month, achievements }: MonthCardProps) {
  const courseCount = achievements.filter((a) => a.type === 'course').length;
  const certCount = achievements.filter((a) => a.type === 'certificate').length;

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(11,28,48,0.04)] overflow-hidden border border-outline-variant/10">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container/60 border-b border-outline-variant/10">
        <h4 className="text-sm font-bold text-vertex-teal font-headline">الشهر {month}</h4>
        <div className="flex items-center gap-2">
          {courseCount > 0 && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {courseCount} دورة
            </span>
          )}
          {certCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {certCount} شهادة
            </span>
          )}
        </div>
      </div>
      <div className="px-4">
        {achievements.map((item) => (
          <AchievementItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StaffAchievementsViewProps {
  staffId: string;
}

export function StaffAchievementsView({ staffId }: StaffAchievementsViewProps) {
  const { data: achievements = [], isLoading } = useStaffAchievementsQuery(staffId);

  const { groupedByMonth, sortedMonthsDesc, monthCounts } = useMemo(() => {
    const grouped: Record<number, StaffAchievement[]> = {};
    achievements.forEach((item) => {
      const m = item.fiscal_month ?? 1;
      if (!grouped[m]) grouped[m] = [];
      grouped[m].push(item);
    });

    const sortedDesc = Object.keys(grouped).map(Number).sort((a, b) => b - a);
    const sortedAsc = [...sortedDesc].reverse();

    const counts: MonthBarData[] = sortedAsc.map((month) => ({
      month,
      count: grouped[month].length,
      courseCount: grouped[month].filter((a) => a.type === 'course').length,
      certCount: grouped[month].filter((a) => a.type === 'certificate').length,
    }));

    return { groupedByMonth: grouped, sortedMonthsDesc: sortedDesc, monthCounts: counts };
  }, [achievements]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-surface-container rounded-2xl" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
          <Icon name="Briefcase" size={32} className="text-outline/40" />
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface mb-1">لا يوجد محتوى في ملف الإنجاز بعد</p>
          <p className="text-xs text-secondary leading-relaxed">سيتم عرض الدورات والشهادات هنا بعد رفعها</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Bar Chart Summary */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(11,28,48,0.04)] border border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-on-surface font-headline">ملخص الإنجازات الشهرية</h3>
          <span className="text-[10px] text-secondary font-medium px-2 py-1 bg-surface-container rounded-lg">
            إجمالي: {achievements.length}
          </span>
        </div>
        <AchievementsBarChart monthCounts={monthCounts} />
      </section>

      {/* Monthly grouped cards */}
      <div className="space-y-4">
        {sortedMonthsDesc.map((month) => (
          <MonthCard key={month} month={month} achievements={groupedByMonth[month]} />
        ))}
      </div>
    </div>
  );
}
