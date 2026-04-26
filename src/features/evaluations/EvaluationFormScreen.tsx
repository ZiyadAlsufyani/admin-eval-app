import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEvaluationQuery, useSaveEvaluationMutation } from '@/api/evaluations';
import { formatISODate } from '@/utils/date';

export default function EvaluationFormScreen() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { staffList, updateStaffStatus, selectedEvaluationWeek } = useOutletContext<StaffOutletContext>();
  const { profile } = useAuth();

  const staff = staffList.find(s => s.id === staffId);
  const weekStartDateString = formatISODate(selectedEvaluationWeek);

  // Queries and Mutations
  const { data: existingEvaluation, isLoading: isFetching } = useEvaluationQuery(staffId || '', weekStartDateString);
  const { mutateAsync: saveEvaluation, isPending: isSaving } = useSaveEvaluationMutation();

  // Local state to store ratings
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  // Hydrate form if a draft exists
  useEffect(() => {
    if (existingEvaluation) {
      setNotes(existingEvaluation.general_notes || '');
      const newRatings: Record<string, number> = {};
      const newJustifs: Record<string, string> = {};
      
      existingEvaluation.details.forEach((detail: any) => {
        newRatings[detail.category_name] = detail.score;
        if (detail.justification_notes) {
          newJustifs[detail.category_name] = detail.justification_notes;
        }
      });
      
      setRatings(newRatings);
      setJustifications(newJustifs);
    }
  }, [existingEvaluation]);

  // Protect against null staff cases (e.g. manual URL navigation to an invalid ID)
  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <h2 className="text-xl font-bold">الموظف غير موجود</h2>
        <button onClick={() => navigate(-1)} className="mt-4 bg-vertex-teal text-white px-4 py-2 rounded-lg">العودة</button>
      </div>
    );
  }

  const QUESTIONS = [
    { id: 'attendance', label: 'الحضور والانصراف' },
    { id: 'duty', label: 'إشراف الأدوار' },
    { id: 'break', label: 'إشراف الفسحة' },
    { id: 'supervision', label: 'المناوبة' }
  ];

  const handleRating = (questionId: string, score: number) => {
    setRatings(prev => ({ ...prev, [questionId]: score }));
  };

  const handleJustification = (questionId: string, text: string) => {
    setJustifications(prev => ({ ...prev, [questionId]: text }));
  };

  const buildPayload = (status: 'draft' | 'submitted') => {
    if (!profile || !staff) return null;

    const details = QUESTIONS.map(q => ({
      category_name: q.id,
      score: ratings[q.id] || 0,
      justification_notes: justifications[q.id] || '',
    }));

    // Calculate percentage based on max 5 per question
    const answeredCount = QUESTIONS.filter(q => ratings[q.id]).length;
    const totalScore = QUESTIONS.reduce((sum, q) => sum + (ratings[q.id] || 0), 0);
    const overall_score_percentage = answeredCount > 0 ? Math.round((totalScore / (QUESTIONS.length * 5)) * 100) : 0;

    return {
      school_id: profile.school_id,
      staff_id: staff.id,
      evaluator_id: profile.id,
      academic_year: '2024-2025',
      week_start_date: weekStartDateString,
      status,
      general_notes: notes,
      overall_score_percentage,
      details,
    };
  };

  const handleSaveDraft = async () => {
    const payload = buildPayload('draft');
    if (!payload) return;
    try {
      await saveEvaluation(payload);
      updateStaffStatus(staff.id, { isDraft: true });
      navigate(-1);
    } catch (e) {
      alert('حدث خطأ أثناء حفظ المسودة');
    }
  };

  const handleSubmit = async () => {
    const payload = buildPayload('submitted');
    if (!payload) return;
    try {
      await saveEvaluation(payload);
      updateStaffStatus(staff.id, { status: 'مكتمل', isDraft: false }); 
      navigate(-1);
    } catch (e) {
      alert('حدث خطأ أثناء الإرسال');
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <h2 className="text-xl font-bold text-vertex-teal">جاري تحميل البيانات...</h2>
      </div>
    );
  }

  return (
    <div className="bg-surface text-foreground min-h-screen pb-24 font-sans" dir="rtl">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md shadow-none border-b border-surface-container pt-safe">
        <div className="flex items-center gap-4 w-full px-6 h-16">
          <button aria-label="العودة" onClick={() => navigate(-1)} className="text-secondary hover:bg-surface-container/50 transition-colors p-2 rounded-full cursor-pointer">
            <Icon name="ArrowRight" size={24} />
          </button>
          <h1 className="font-bold tracking-tight text-foreground text-lg">تقييم {staff.name}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Header Info Card */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0px_12px_32px_rgba(0,0,0,0.03)] border border-surface-container space-y-3">
          <div className="flex items-center justify-between">
            <span className="bg-vertex-teal text-white px-3 py-1 rounded-full text-[10px] font-bold">نموذج التقييم الاسبوعي</span>
            <span className="text-xs font-semibold text-secondary">الاسبوع 14</span>
          </div>
          <div className="flex gap-4 items-center pt-2">
            <img src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${staff.name}&background=random`} alt={staff.name} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-surface-container" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{staff.name}</h2>
              <p className="text-sm font-medium text-secondary">{staff.subject || staff.role}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Discipline (الانضباط) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Icon name="ShieldCheck" size={24} className="text-vertex-teal" />
            <h3 className="text-lg font-bold">الانضباط</h3>
          </div>
          
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-4 space-y-8">
            {QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-3">
                <label className="text-sm font-bold text-secondary">{q.label}</label>
                
                {/* 5-Point Selector */}
                <div className="grid gap-1.5 p-1.5 bg-surface-container rounded-lg grid-cols-5">
                  {[5, 4, 3, 2, 1].map(score => {
                    const isSelected = ratings[q.id] === score;
                    return (
                      <button 
                        key={score}
                        onClick={() => handleRating(q.id, score)}
                        className={`text-sm py-2 rounded-md font-bold transition-colors ${
                          isSelected 
                            ? 'bg-vertex-teal text-white shadow-md' 
                            : 'text-secondary hover:bg-surface/50'
                        }`}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>

                {/* Optional Justification */}
                <div className="flex gap-2 items-start mt-2">
                  <textarea 
                    value={justifications[q.id] || ''}
                    onChange={(e) => handleJustification(q.id, e.target.value)}
                    className="flex-1 text-[11px] p-2.5 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-vertex-teal min-h-[60px] resize-none" 
                    placeholder="أضف مبررات التقييم..."
                  />
                  <button aria-label="إرفاق ملف" className="p-2.5 bg-surface-container rounded-lg text-secondary hover:text-vertex-teal transition-colors">
                    <Icon name="Paperclip" size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Principal's Feedback */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Icon name="MessageSquare" size={24} className="text-vertex-teal" />
            <h3 className="text-lg font-bold">ملاحظات المدير/ة</h3>
          </div>
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-1 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-vertex-teal transition-all">
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[120px] p-4 bg-transparent border-none focus:ring-0 text-sm resize-none" 
              placeholder="أدخل ملاحظات التقييم النوعي هنا..." 
            />
            <div className="px-4 py-2 border-t border-surface-container flex justify-end">
              <span className="text-[10px] text-secondary">الحد الأقصى 500 كلمة</span>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-4 flex flex-col gap-3">
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-4 bg-vertex-teal text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSaving ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
          <button 
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="w-full py-4 bg-surface-container text-foreground font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ مسودة'}
          </button>
        </div>
      </main>
    </div>
  );
}
