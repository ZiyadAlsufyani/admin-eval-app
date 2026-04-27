import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEvaluationQuery, useSaveEvaluationMutation } from '@/api/evaluations';
import { uploadEvaluationEvidence, deleteEvaluationEvidence, getEvidenceUrl, MAX_FILE_SIZE_MB, MAX_FILES_PER_CATEGORY } from '@/api/storage';
import { formatISODate } from '@/utils/date';

export default function EvaluationFormScreen() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { staffList, updateStaffStatus, selectedEvaluationWeek, academicContext } = useOutletContext<StaffOutletContext>();
  const { profile } = useAuth();

  const staff = staffList.find(s => s.id === staffId);
  const weekStartDateString = formatISODate(selectedEvaluationWeek);

  // Queries and Mutations
  const { data: existingEvaluation, isLoading: isFetching } = useEvaluationQuery(staffId || '', weekStartDateString);
  const { mutateAsync: saveEvaluation, isPending: isSaving } = useSaveEvaluationMutation();

  // Local state to store ratings
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, string[]>>({});
  
  // Deferred storage state
  const [pendingUploads, setPendingUploads] = useState<Record<string, { file: File, preview: string }[]>>({});
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<string | null>(null);

  // Hydrate form if a draft exists, or reset if switching to a blank context
  useEffect(() => {
    if (existingEvaluation) {
      setNotes(existingEvaluation.general_notes || '');
      const newRatings: Record<string, number> = {};
      const newJustifs: Record<string, string> = {};
      const newAttachments: Record<string, string[]> = {};
      
      existingEvaluation.details.forEach((detail: any) => {
        newRatings[detail.category_name] = detail.score;
        if (detail.justification_notes) {
          newJustifs[detail.category_name] = detail.justification_notes;
        }
        if (detail.attachments && Array.isArray(detail.attachments)) {
          newAttachments[detail.category_name] = detail.attachments;
        }
      });
      
      setRatings(newRatings);
      setJustifications(newJustifs);
      setAttachments(newAttachments);
      setPendingUploads({});
      setPendingDeletions([]);
    } else {
      // Reset form state to prevent stale data from a previous context
      setRatings({});
      setJustifications({});
      setAttachments({});
      setPendingUploads({});
      setPendingDeletions([]);
      setNotes('');
    }
  }, [existingEvaluation]);

  // Track all ObjectURLs in a ref so cleanup always sees the latest values
  const previewUrlsRef = useRef<Set<string>>(new Set());

  // Sync the ref whenever pendingUploads changes
  useEffect(() => {
    const currentUrls = new Set(
      Object.values(pendingUploads).flat().map(p => p.preview)
    );
    previewUrlsRef.current = currentUrls;
  }, [pendingUploads]);

  // Clean up all tracked ObjectURLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

  const triggerFileUpload = (categoryId: string) => {
    setActiveUploadCategory(categoryId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadCategory || !profile || !staff) return;

    // Validation: Max files per category
    const currentAttachments = attachments[activeUploadCategory] || [];
    const currentPending = pendingUploads[activeUploadCategory] || [];
    
    // Calculate total: existing (minus deleted) + pending
    const totalFiles = 
      currentAttachments.filter(path => !pendingDeletions.includes(path)).length + 
      currentPending.length;

    if (totalFiles >= MAX_FILES_PER_CATEGORY) {
      alert(`الحد الأقصى هو ${MAX_FILES_PER_CATEGORY} مرفقات لكل قسم.`);
      setActiveUploadCategory(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validation: Max file size
    const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert(`حجم الملف كبير جداً. الحد الأقصى هو ${MAX_FILE_SIZE_MB} ميجابايت.`);
      setActiveUploadCategory(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate local preview
    const preview = URL.createObjectURL(file);
    
    setPendingUploads(prev => ({
      ...prev,
      [activeUploadCategory]: [...(prev[activeUploadCategory] || []), { file, preview }]
    }));

    setActiveUploadCategory(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (categoryId: string, pathOrPreview: string, isPending: boolean) => {
    if (isPending) {
      // It's a local pending file. Revoke the URL and remove from state.
      URL.revokeObjectURL(pathOrPreview);
      setPendingUploads(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].filter(p => p.preview !== pathOrPreview)
      }));
    } else {
      // It's an existing DB path. Queue it for deletion.
      if (!pendingDeletions.includes(pathOrPreview)) {
        setPendingDeletions(prev => [...prev, pathOrPreview]);
      }
    }
  };

  const buildPayload = (status: 'draft' | 'submitted', finalAttachments: Record<string, string[]>) => {
    if (!profile || !staff) return null;

    const details = QUESTIONS.map(q => ({
      category_name: q.id,
      score: ratings[q.id] || 0,
      justification_notes: justifications[q.id] || '',
      attachments: finalAttachments[q.id] || [],
    }));

    // Calculate percentage based on max 5 per question
    const answeredCount = QUESTIONS.filter(q => ratings[q.id]).length;
    const totalScore = QUESTIONS.reduce((sum, q) => sum + (ratings[q.id] || 0), 0);
    const overall_score_percentage = answeredCount > 0 ? Math.round((totalScore / (QUESTIONS.length * 5)) * 100) : 0;

    return {
      school_id: profile.school_id,
      staff_id: staff.id,
      evaluator_id: profile.id,
      academic_year: academicContext?.activeTerm.academic_year || '2024-2025',
      week_start_date: weekStartDateString,
      status,
      general_notes: notes,
      overall_score_percentage,
      term_id: academicContext?.activeTerm.id,
      academic_week_number: academicContext?.weekNumber,
      details,
    };
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!profile || !staff) return;
    
    setIsUploading(true);
    const newlyUploadedPaths: string[] = []; // Track for rollback
    try {
      // Step 1: Deep-clone attachments to avoid mutating React state
      const finalAttachments: Record<string, string[]> = Object.fromEntries(
        Object.entries(attachments).map(([k, v]) => [k, [...v]])
      );

      // Step 2: Concurrently upload all pending files
      const uploadPromises: Promise<void>[] = [];

      Object.entries(pendingUploads).forEach(([categoryId, uploads]) => {
        if (!finalAttachments[categoryId]) finalAttachments[categoryId] = [];
        
        uploads.forEach(upload => {
          const promise = uploadEvaluationEvidence(
            upload.file,
            profile.school_id,
            staff.id,
            weekStartDateString,
            categoryId
          ).then(path => {
            newlyUploadedPaths.push(path);
            finalAttachments[categoryId] = [...finalAttachments[categoryId], path];
          });
          uploadPromises.push(promise);
        });
      });

      await Promise.all(uploadPromises);

      // Step 3: Remove any queued deletions from the final attachments array
      Object.keys(finalAttachments).forEach(categoryId => {
        finalAttachments[categoryId] = finalAttachments[categoryId].filter(
          path => !pendingDeletions.includes(path)
        );
      });

      // Step 4: Save to DB
      const payload = buildPayload(status, finalAttachments);
      if (!payload) throw new Error('Invalid payload');
      
      await saveEvaluation(payload);
      
      // Step 5: Concurrently delete from bucket only after DB is secured
      if (pendingDeletions.length > 0) {
        const deletePromises = pendingDeletions.map(path => 
          deleteEvaluationEvidence(path).catch(err => console.error('Failed to delete file:', path, err))
        );
        await Promise.all(deletePromises);
      }

      updateStaffStatus(staff.id, { status: status === 'submitted' ? 'مكتمل' : 'مسودة', isDraft: status === 'draft' });
      navigate(-1);
    } catch (e) {
      // Rollback: delete any files that were uploaded before the failure
      if (newlyUploadedPaths.length > 0) {
        console.warn('Save failed, rolling back uploaded files:', newlyUploadedPaths);
        const rollbackPromises = newlyUploadedPaths.map(path => 
          deleteEvaluationEvidence(path).catch(err => console.error('Rollback failed for:', path, err))
        );
        await Promise.all(rollbackPromises);
      }
      alert('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
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
      {/* Hidden file input for handling generic uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,.pdf,.doc,.docx"
      />
      
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
            <span className="text-xs font-semibold text-secondary">
              {academicContext?.weekNumber ? `الأسبوع ${academicContext.weekNumber}` : 'الأسبوع الحالي'}
            </span>
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
                  <button 
                    onClick={() => triggerFileUpload(q.id)}
                    disabled={isUploading}
                    aria-label="إرفاق ملف" 
                    className="p-2.5 bg-surface-container rounded-lg text-secondary hover:text-vertex-teal transition-colors disabled:opacity-50"
                  >
                    <Icon name="Paperclip" size={18} />
                  </button>
                </div>

                {/* Attachments Preview */}
                <div className="mt-3 space-y-2">
                  {/* Existing DB Attachments */}
                  {(attachments[q.id] || [])
                    .filter(path => !pendingDeletions.includes(path))
                    .map(path => {
                      const fileName = path.split('/').pop() || 'ملف مرفق';
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                      const url = getEvidenceUrl(path);
                      
                      return (
                        <div key={path} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container border border-surface-container-high">
                          {isImage ? (
                            <img src={url} alt={fileName} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-vertex-teal shrink-0">
                              <Icon name="FileText" size={16} />
                            </div>
                          )}
                          <span className="flex-1 text-xs text-secondary truncate" dir="ltr">{fileName.replace(/^\d+_/, '')}</span>
                          <button 
                            onClick={() => handleDeleteFile(q.id, path, false)}
                            disabled={isUploading}
                            className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      );
                  })}
                  
                  {/* Pending Local Uploads */}
                  {(pendingUploads[q.id] || []).map((upload) => {
                    const fileName = upload.file.name;
                    const isImage = fileInputRef.current?.accept.includes('image') && upload.file.type.startsWith('image/');
                    
                    return (
                      <div key={upload.preview} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container border border-vertex-teal/30">
                        {isImage ? (
                          <img src={upload.preview} alt={fileName} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-vertex-teal shrink-0">
                            <Icon name="FileText" size={16} />
                          </div>
                        )}
                        <span className="flex-1 text-xs text-secondary truncate" dir="ltr">{fileName}</span>
                        <button 
                          onClick={() => handleDeleteFile(q.id, upload.preview, true)}
                          disabled={isUploading}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    );
                  })}
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
            onClick={() => handleSave('submitted')}
            disabled={isSaving || isUploading}
            className="w-full py-4 flex items-center justify-center gap-2 bg-vertex-teal text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {(isSaving || isUploading) ? (
              <><Icon name="Loader2" size={20} className="animate-spin" /> جاري الإرسال...</>
            ) : 'إرسال التقييم'}
          </button>
          <button 
            onClick={() => handleSave('draft')}
            disabled={isSaving || isUploading}
            className="w-full py-4 flex items-center justify-center gap-2 bg-surface-container text-foreground font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {(isSaving || isUploading) ? (
              <><Icon name="Loader2" size={20} className="animate-spin" /> جاري الحفظ...</>
            ) : 'حفظ مسودة'}
          </button>
        </div>
      </main>
    </div>
  );
}
