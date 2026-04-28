import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEvaluationQuery, useSaveEvaluationMutation } from '@/api/evaluations';
import { AppHeader } from '@/components/layout/AppHeader';
import { uploadEvaluationEvidence, deleteEvaluationEvidence, getEvidenceUrl, MAX_FILE_SIZE_MB, MAX_FILES_PER_CATEGORY } from '@/api/storage';
import { set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { formatISODate } from '@/utils/date';

// ---- Draft shape stored in IDB ----
interface EvaluationDraft {
  ratings: Record<string, number>;
  notes: string;
  pendingUploads: Record<string, { file: File }[]>;
}

export default function EvaluationFormScreen() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { staffList, updateStaffStatus, selectedEvaluationWeek, academicContext } = useOutletContext<StaffOutletContext>();
  const { profile } = useAuth();

  const staff = staffList.find(s => s.id === staffId);
  const weekStartDateString = formatISODate(selectedEvaluationWeek);
  const idbKey = staff ? `draft_uploads_${staff.id}_${weekStartDateString}` : null;

  // Queries and Mutations
  const { data: existingEvaluation, isLoading: isFetching } = useEvaluationQuery(staffId || '', weekStartDateString);
  const { mutateAsync: saveEvaluation, isPending: isSaving } = useSaveEvaluationMutation();

  // ---- Core form state ----
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, string[]>>({});
  const [pendingUploads, setPendingUploads] = useState<Record<string, { file: File; preview: string }[]>>({});
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ---- IDB load flag — prevents the save effect running before initial hydration ----
  const [isIDBLoaded, setIsIDBLoaded] = useState(false);
  // Prevents the DB-hydration effect from overwriting IDB-restored state
  const isRestoredRef = useRef(false);

  // ---- Refs for access inside stable callbacks ----
  const attachmentsRef = useRef(attachments);
  const pendingUploadsRef = useRef(pendingUploads);
  const pendingDeletionsRef = useRef(pendingDeletions);
  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);
  useEffect(() => { pendingUploadsRef.current = pendingUploads; }, [pendingUploads]);
  useEffect(() => { pendingDeletionsRef.current = pendingDeletions; }, [pendingDeletions]);

  // ---- Phase 1: Load IDB draft on mount ----
  useEffect(() => {
    if (!idbKey) return;
    idbGet(idbKey).then((draft: EvaluationDraft | undefined) => {
      if (draft) {
        isRestoredRef.current = true;
        setRatings(draft.ratings || {});
        setNotes(draft.notes || '');
        // Reconstruct File previews from stored File objects
        const restoredUploads: Record<string, { file: File; preview: string }[]> = {};
        for (const [cat, items] of Object.entries(draft.pendingUploads || {})) {
          restoredUploads[cat] = items.map(i => ({
            file: i.file,
            preview: URL.createObjectURL(i.file),
          }));
        }
        setPendingUploads(restoredUploads);
      }
      setIsIDBLoaded(true);
    }).catch(err => {
      console.error('IDB load failed:', err);
      setIsIDBLoaded(true);
    });
  }, [idbKey]);

  // ---- Phase 2: Hydrate from DB evaluation (only if no IDB draft) ----
  useEffect(() => {
    if (isRestoredRef.current) return;

    if (existingEvaluation) {
      const newRatings: Record<string, number> = {};
      const newJustifs: Record<string, string> = {};
      const newAttachments: Record<string, string[]> = {};
      existingEvaluation.details.forEach((detail: any) => {
        newRatings[detail.category_name] = detail.score;
        if (detail.justification_notes) newJustifs[detail.category_name] = detail.justification_notes;
        if (detail.attachments && Array.isArray(detail.attachments)) {
          newAttachments[detail.category_name] = detail.attachments;
        }
      });
      setNotes(existingEvaluation.general_notes || '');
      setRatings(newRatings);
      setJustifications(newJustifs);
      setAttachments(newAttachments);
      setPendingUploads({});
      setPendingDeletions([]);
    }
  }, [existingEvaluation]);

  // ---- Phase 3: Save consolidated draft to IDB on every change ----
  useEffect(() => {
    if (!isIDBLoaded || !idbKey) return;

    const hasDraftContent =
      Object.keys(ratings).length > 0 ||
      notes.length > 0 ||
      Object.values(pendingUploads).some(arr => arr.length > 0);

    if (hasDraftContent) {
      const storable: EvaluationDraft = {
        ratings,
        notes,
        pendingUploads: Object.fromEntries(
          Object.entries(pendingUploads).map(([cat, items]) => [cat, items.map(i => ({ file: i.file }))])
        ),
      };
      idbSet(idbKey, storable).catch(console.error);
    } else {
      idbDel(idbKey).catch(console.error);
    }
  }, [pendingUploads, ratings, notes, isIDBLoaded, idbKey]);

  // ---- ObjectURL cleanup on unmount ----
  const previewUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentUrls = new Set(Object.values(pendingUploads).flat().map(p => p.preview));
    previewUrlsRef.current = currentUrls;
  }, [pendingUploads]);
  useEffect(() => {
    return () => { previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  // ---- Guard: invalid staff ID ----
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
    { id: 'supervision', label: 'المناوبة' },
  ];

  const handleRating = (questionId: string, score: number) => {
    setRatings(prev => ({ ...prev, [questionId]: score }));
  };

  const handleJustification = (questionId: string, text: string) => {
    setJustifications(prev => ({ ...prev, [questionId]: text }));
  };

  /**
   * Compresses an image file via canvas to fit within the size limit.
   * Non-image files are returned as-is.
   */
  const compressImageIfNeeded = (file: File, maxBytes: number): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size <= maxBytes) {
      return Promise.resolve(file);
    }

    return new Promise(resolve => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1920;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        try {
          ctx.drawImage(img, 0, 0, width, height);
        } catch {
          resolve(file);
          return;
        }
        canvas.toBlob(blob => {
          if (blob && blob.size <= maxBytes) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            canvas.toBlob(blob2 => {
              resolve(blob2
                ? new File([blob2], file.name, { type: 'image/jpeg', lastModified: Date.now() })
                : file);
            }, 'image/jpeg', 0.6);
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });
  };

  const processFileForCategory = async (rawFile: File, categoryId: string, cleanupCallback?: () => void) => {
    if (!profile || !staff) { cleanupCallback?.(); return; }

    const currentAttachments = attachmentsRef.current[categoryId] || [];
    const currentPending = pendingUploadsRef.current[categoryId] || [];
    const currentPendingDeletions = pendingDeletionsRef.current;
    const totalFiles =
      currentAttachments.filter(path => !currentPendingDeletions.includes(path)).length +
      currentPending.length;

    if (totalFiles >= MAX_FILES_PER_CATEGORY) {
      alert(`الحد الأقصى هو ${MAX_FILES_PER_CATEGORY} مرفقات لكل قسم.`);
      cleanupCallback?.();
      return;
    }

    const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const file = await compressImageIfNeeded(rawFile, MAX_SIZE_BYTES);

    if (file.size > MAX_SIZE_BYTES) {
      alert(`حجم الملف كبير جداً. الحد الأقصى هو ${MAX_FILE_SIZE_MB} ميجابايت.`);
      cleanupCallback?.();
      return;
    }

    const preview = URL.createObjectURL(file);

    setPendingUploads(prev => {
      const existingFiles = prev[categoryId] || [];
      const currentAtts = attachmentsRef.current[categoryId] || [];
      const currentDels = pendingDeletionsRef.current;
      const finalTotal = currentAtts.filter(p => !currentDels.includes(p)).length + existingFiles.length;
      if (finalTotal >= MAX_FILES_PER_CATEGORY) {
        setTimeout(() => alert(`الحد الأقصى هو ${MAX_FILES_PER_CATEGORY} مرفقات لكل قسم.`), 0);
        return prev;
      }
      return { ...prev, [categoryId]: [...existingFiles, { file, preview }] };
    });

    cleanupCallback?.();
  };

  const handleGlobalFileChange = useCallback(async (e: Event | { target: HTMLInputElement }) => {
    const target = e.target as HTMLInputElement;
    const rawFile = target.files?.[0];
    const categoryId = localStorage.getItem('pendingUploadCategory');
    if (!rawFile || !categoryId) { target.value = ''; return; }
    await processFileForCategory(rawFile, categoryId, () => {
      target.value = '';
      localStorage.removeItem('pendingUploadCategory');
    });
  }, [profile, staff]);

  // ---- Hook up the single global file listener ----
  useEffect(() => {
    const fileInput = document.getElementById('global-mobile-file-input') as HTMLInputElement;
    if (!fileInput) return;
    fileInput.addEventListener('change', handleGlobalFileChange);
    // Note: Pre-boot interceptor in main.tsx handles activity-kill recovery.
    return () => { fileInput.removeEventListener('change', handleGlobalFileChange); };
  }, [handleGlobalFileChange]);

  const triggerFileUpload = (categoryId: string) => {
    if (staff) {
      localStorage.setItem('currentUploadIdbKey', `draft_uploads_${staff.id}_${weekStartDateString}`);
    }
    localStorage.setItem('pendingUploadCategory', categoryId);
    const globalInput = document.getElementById('global-mobile-file-input') as HTMLInputElement;
    globalInput?.click();
  };

  const handleDeleteFile = (categoryId: string, pathOrPreview: string, isPending: boolean) => {
    if (isPending) {
      URL.revokeObjectURL(pathOrPreview);
      setPendingUploads(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].filter(p => p.preview !== pathOrPreview),
      }));
    } else {
      if (!pendingDeletions.includes(pathOrPreview)) {
        setPendingDeletions(prev => [...prev, pathOrPreview]);
      }
    }
  };

  const buildPayload = (status: 'draft' | 'submitted', finalAttachments: Record<string, string[]>) => {
    if (!profile || !staff) return null;

    // Skip unanswered questions — DB CHECK constraint requires score >= 1.
    const details = QUESTIONS
      .filter(q => !!ratings[q.id])
      .map(q => ({
        category_name: q.id,
        score: ratings[q.id],
        justification_notes: justifications[q.id] || '',
        attachments: finalAttachments[q.id] || [],
      }));

    const answeredCount = QUESTIONS.filter(q => ratings[q.id]).length;
    const totalScore = QUESTIONS.reduce((sum, q) => sum + (ratings[q.id] || 0), 0);
    const overall_score_percentage = answeredCount > 0
      ? Math.round((totalScore / (QUESTIONS.length * 5)) * 100)
      : 0;

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

    if (status === 'submitted') {
      const unanswered = QUESTIONS.filter(q => !ratings[q.id]);
      if (unanswered.length > 0) {
        alert(`يرجى تقييم جميع البنود قبل الإرسال. البنود غير المكتملة: ${unanswered.map(q => q.label).join('، ')}`);
        return;
      }
    }

    setIsUploading(true);
    const newlyUploadedPaths: string[] = [];
    try {
      const finalAttachments: Record<string, string[]> = Object.fromEntries(
        Object.entries(attachments).map(([k, v]) => [k, [...v]])
      );

      const uploadPromises: Promise<void>[] = [];
      Object.entries(pendingUploads).forEach(([categoryId, uploads]) => {
        if (!finalAttachments[categoryId]) finalAttachments[categoryId] = [];
        uploads.forEach(upload => {
          const promise = uploadEvaluationEvidence(
            upload.file, profile.school_id, staff.id, weekStartDateString, categoryId
          ).then(path => {
            newlyUploadedPaths.push(path);
            finalAttachments[categoryId] = [...finalAttachments[categoryId], path];
          });
          uploadPromises.push(promise);
        });
      });

      await Promise.all(uploadPromises);

      Object.keys(finalAttachments).forEach(categoryId => {
        finalAttachments[categoryId] = finalAttachments[categoryId].filter(
          path => !pendingDeletions.includes(path)
        );
      });

      const payload = buildPayload(status, finalAttachments);
      if (!payload) throw new Error('Invalid payload');
      await saveEvaluation(payload);

      if (pendingDeletions.length > 0) {
        await Promise.all(
          pendingDeletions.map(path =>
            deleteEvaluationEvidence(path).catch(err => console.error('Delete failed:', path, err))
          )
        );
      }

      // Clear entire IDB draft on success
      if (idbKey) await idbDel(idbKey).catch(console.error);

      updateStaffStatus(staff.id, {
        status: status === 'submitted' ? 'مكتمل' : 'مسودة',
        isDraft: status === 'draft',
      });
      navigate(-1);
    } catch (e) {
      if (newlyUploadedPaths.length > 0) {
        console.warn('Save failed, rolling back:', newlyUploadedPaths);
        await Promise.all(
          newlyUploadedPaths.map(path =>
            deleteEvaluationEvidence(path).catch(err => console.error('Rollback failed:', path, err))
          )
        );
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

      {/* TopAppBar */}
      <AppHeader
        title={`تقييم ${staff.name}`}
        actions={
          <button aria-label="العودة" onClick={() => navigate(-1)} className="text-secondary hover:bg-surface-container/50 transition-colors p-2 rounded-full cursor-pointer">
            <Icon name="ArrowRight" size={24} />
          </button>
        }
      />

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

        {/* Section 1: Discipline */}
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
                          isSelected ? 'bg-vertex-teal text-white shadow-md' : 'text-secondary hover:bg-surface/50'
                        }`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Justification + Paperclip */}
                <div className="flex gap-2 items-start mt-2">
                  <textarea
                    value={justifications[q.id] || ''}
                    onChange={(e) => handleJustification(q.id, e.target.value)}
                    className="flex-1 text-[11px] p-2.5 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-vertex-teal min-h-[60px] resize-none"
                    placeholder="أضف مبررات التقييم..."
                  />
                  <button
                    type="button"
                    onClick={() => triggerFileUpload(q.id)}
                    aria-label="إرفاق ملف أو صورة"
                    className={`p-2.5 bg-surface-container rounded-lg text-secondary hover:text-vertex-teal transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
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
                  {(pendingUploads[q.id] || []).map(upload => {
                    const fileName = upload.file.name;
                    const isImage = upload.file.type.startsWith('image/');
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
