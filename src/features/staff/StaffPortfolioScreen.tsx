import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/components/auth/AuthProvider';
import type { StaffOutletContext } from '@/components/layout/MobileLayout';
import { set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { usePortfolioQuery, useSavePortfolioMutation } from '@/api/portfolio';
import type { StaffAchievement } from '@/api/portfolio';
import { uploadPortfolioDocument, compressImageIfNeeded, MAX_FILE_SIZE_MB, MAX_PORTFOLIO_FILES_PER_ENTRY } from '@/api/storage';

interface ProfDevEntry {
  id: string;
  name: string;
  role: 'منفذ' | 'مستفيد' | '';
  hours: number | '';
  document_url?: string | null;
  pendingFile?: File | null;
  previewUrl?: string | null;
}

interface CertificateEntry {
  id: string;
  name: string;
  document_url?: string | null;
  pendingFile?: File | null;
  previewUrl?: string | null;
}

interface PortfolioDraft {
  profDevEntries: ProfDevEntry[];
  certificateEntries: CertificateEntry[];
}

const MAX_ENTRIES = 5;

export default function StaffPortfolioScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { fiscalContext } = useOutletContext<StaffOutletContext>();
  
  // Queries & Mutations
  const { data: dbAchievements } = usePortfolioQuery(
    profile?.id,
    fiscalContext?.activeFiscalYear.year_label,
    fiscalContext?.currentMonth
  );
  const { mutateAsync: savePortfolio } = useSavePortfolioMutation();

  const [isProfDevOpen, setIsProfDevOpen] = useState(true);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profDevEntries, setProfDevEntries] = useState<ProfDevEntry[]>([]);
  const [certificateEntries, setCertificateEntries] = useState<CertificateEntry[]>([]);

  const [isIDBLoaded, setIsIDBLoaded] = useState(false);
  const hasEditedRef = useRef(false);
  const isRestoredRef = useRef(false);

  const idbKey = profile && fiscalContext
    ? `portfolio_draft_${profile.id}_${fiscalContext.activeFiscalYear.year_label}_${fiscalContext.currentMonth}`
    : null;

  // Refs for stable callbacks
  const profDevRef = useRef(profDevEntries);
  const certRef = useRef(certificateEntries);
  useEffect(() => { profDevRef.current = profDevEntries; }, [profDevEntries]);
  useEffect(() => { certRef.current = certificateEntries; }, [certificateEntries]);

  // Phase 1: Load IDB Draft
  useEffect(() => {
    if (!idbKey || isIDBLoaded) return;
    idbGet<PortfolioDraft>(idbKey).then(draft => {
      if (draft) {
        // Rehydrate previews
        draft.profDevEntries.forEach(e => {
          if (e.pendingFile) e.previewUrl = URL.createObjectURL(e.pendingFile);
        });
        draft.certificateEntries.forEach(e => {
          if (e.pendingFile) e.previewUrl = URL.createObjectURL(e.pendingFile);
        });
        setProfDevEntries(draft.profDevEntries);
        setCertificateEntries(draft.certificateEntries);
        isRestoredRef.current = true;
      }
      setIsIDBLoaded(true);
    }).catch(console.error);
  }, [idbKey, isIDBLoaded]);

  // Phase 2: Hydrate from DB
  useEffect(() => {
    if (dbAchievements && isIDBLoaded) {
      if (isRestoredRef.current) return; // Don't overwrite local draft if exists

      const pd: ProfDevEntry[] = [];
      const certs: CertificateEntry[] = [];

      dbAchievements.forEach(ach => {
        if (ach.type === 'course') {
          pd.push({
            id: ach.id!,
            name: ach.title,
            role: (ach.role as 'منفذ' | 'مستفيد' | '') || '',
            hours: ach.hours || '',
            document_url: ach.document_url,
          });
        } else {
          certs.push({
            id: ach.id!,
            name: ach.title,
            document_url: ach.document_url,
          });
        }
      });

      if (pd.length === 0) pd.push({ id: crypto.randomUUID(), name: '', role: '', hours: '' });
      if (certs.length === 0) certs.push({ id: crypto.randomUUID(), name: '' });

      setProfDevEntries(pd);
      setCertificateEntries(certs);
    }
  }, [dbAchievements, isIDBLoaded]);

  // Phase 3: Save to IDB
  useEffect(() => {
    if (!isIDBLoaded || !idbKey) return;
    
    const hasContent = 
      profDevEntries.some(e => e.name || e.role || e.hours || e.pendingFile) ||
      certificateEntries.some(e => e.name || e.pendingFile);

    if (hasContent && hasEditedRef.current) {
      const draft: PortfolioDraft = {
        profDevEntries: profDevEntries.map(e => ({ ...e, previewUrl: null })),
        certificateEntries: certificateEntries.map(e => ({ ...e, previewUrl: null }))
      };
      idbSet(idbKey, draft).catch(console.error);
    } else if (!hasContent) {
      idbDel(idbKey).catch(console.error);
    }
  }, [profDevEntries, certificateEntries, isIDBLoaded, idbKey]);

  // Handlers
  const addProfDevEntry = () => {
    if (profDevEntries.length >= MAX_ENTRIES) return;
    hasEditedRef.current = true;
    setProfDevEntries(prev => [...prev, { id: crypto.randomUUID(), name: '', role: '', hours: '' }]);
  };

  const updateProfDevEntry = (id: string, field: keyof ProfDevEntry, value: any) => {
    hasEditedRef.current = true;
    setProfDevEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addCertificateEntry = () => {
    if (certificateEntries.length >= MAX_ENTRIES) return;
    hasEditedRef.current = true;
    setCertificateEntries(prev => [...prev, { id: crypto.randomUUID(), name: '' }]);
  };

  const updateCertificateEntry = (id: string, field: keyof CertificateEntry, value: any) => {
    hasEditedRef.current = true;
    setCertificateEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Global File Handling
  const triggerFileInput = (type: 'course' | 'certificate', entryId: string) => {
    localStorage.setItem('portfolioUploadType', type);
    localStorage.setItem('portfolioUploadEntryId', entryId);
    const globalInput = document.getElementById('global-mobile-file-input') as HTMLInputElement;
    if (globalInput) {
      globalInput.value = '';
      globalInput.click();
    }
  };

  const handleGlobalFileChange = useCallback(async (e: Event | { target: HTMLInputElement }) => {
    const target = e.target as HTMLInputElement;
    const rawFile = target.files?.[0];
    const type = localStorage.getItem('portfolioUploadType');
    const entryId = localStorage.getItem('portfolioUploadEntryId');
    
    if (!rawFile || !type || !entryId) { target.value = ''; return; }

    const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const file = await compressImageIfNeeded(rawFile, MAX_SIZE_BYTES);

    if (file.size > MAX_SIZE_BYTES) {
      const actualSizeMB = (file.size / 1024 / 1024).toFixed(2);
      alert(`حجم الملف (${actualSizeMB} ميجابايت) يتجاوز الحد الأقصى وهو ${MAX_FILE_SIZE_MB} ميجابايت.`);
      target.value = '';
      localStorage.removeItem('portfolioUploadType');
      localStorage.removeItem('portfolioUploadEntryId');
      return;
    }

    const preview = URL.createObjectURL(file);
    hasEditedRef.current = true;

    if (type === 'course') {
      const entry = profDevRef.current.find(e => e.id === entryId);
      if (entry && (entry.document_url || entry.pendingFile) && MAX_PORTFOLIO_FILES_PER_ENTRY === 1) {
         // Overwrite existing file logic (optional, we'll replace the existing pending file)
      }
      setProfDevEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, pendingFile: file, previewUrl: preview } : e
      ));
    } else {
      setCertificateEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, pendingFile: file, previewUrl: preview } : e
      ));
    }

    target.value = '';
    localStorage.removeItem('portfolioUploadType');
    localStorage.removeItem('portfolioUploadEntryId');
  }, []);

  useEffect(() => {
    const input = document.getElementById('global-mobile-file-input') as HTMLInputElement;
    if (!input) return;
    input.addEventListener('change', handleGlobalFileChange);
    return () => input.removeEventListener('change', handleGlobalFileChange);
  }, [handleGlobalFileChange]);

  const handleDeleteFile = (type: 'course' | 'certificate', entryId: string, isPending: boolean) => {
    hasEditedRef.current = true;
    if (type === 'course') {
      setProfDevEntries(prev => prev.map(e => {
        if (e.id === entryId) {
          if (isPending && e.previewUrl) URL.revokeObjectURL(e.previewUrl);
          return isPending ? { ...e, pendingFile: null, previewUrl: null } : { ...e, document_url: null };
        }
        return e;
      }));
    } else {
      setCertificateEntries(prev => prev.map(e => {
        if (e.id === entryId) {
          if (isPending && e.previewUrl) URL.revokeObjectURL(e.previewUrl);
          return isPending ? { ...e, pendingFile: null, previewUrl: null } : { ...e, document_url: null };
        }
        return e;
      }));
    }
  };

  const handleSave = async () => {
    if (!profile || !profile.school_id || !fiscalContext) return;
    
    // Filter out completely empty entries
    const validProfDev = profDevEntries.filter(e => e.name.trim() !== '');
    const validCerts = certificateEntries.filter(e => e.name.trim() !== '');

    if (validProfDev.length === 0 && validCerts.length === 0) {
      alert("الرجاء إضافة بيانات للحفظ");
      return;
    }

    setIsSaving(true);
    try {
      const dbAchievementsPayload: StaffAchievement[] = [];

      // Upload PD files
      for (const e of validProfDev) {
        let docUrl = e.document_url;
        if (e.pendingFile) {
          docUrl = await uploadPortfolioDocument(e.pendingFile, profile.school_id, profile.id, 'course', e.id);
        }
        dbAchievementsPayload.push({
          id: e.id,
          staff_id: profile.id,
          school_id: profile.school_id,
          type: 'course',
          title: e.name,
          role: e.role || null,
          hours: typeof e.hours === 'number' ? e.hours : null,
          document_url: docUrl || null,
          fiscal_month: fiscalContext.currentMonth,
          fiscal_year_label: fiscalContext.activeFiscalYear.year_label
        });
      }

      // Upload Cert files
      for (const e of validCerts) {
        let docUrl = e.document_url;
        if (e.pendingFile) {
          docUrl = await uploadPortfolioDocument(e.pendingFile, profile.school_id, profile.id, 'certificate', e.id);
        }
        dbAchievementsPayload.push({
          id: e.id,
          staff_id: profile.id,
          school_id: profile.school_id,
          type: 'certificate',
          title: e.name,
          document_url: docUrl || null,
          fiscal_month: fiscalContext.currentMonth,
          fiscal_year_label: fiscalContext.activeFiscalYear.year_label
        });
      }

      await savePortfolio(dbAchievementsPayload);
      
      // Clean up IDB
      if (idbKey) await idbDel(idbKey);
      hasEditedRef.current = false;
      isRestoredRef.current = false;
      
      alert("تم الحفظ بنجاح!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 font-body" dir="rtl">
      <AppHeader
        title="ملف الإنجاز"
        actions={
          <button 
            onClick={() => navigate(-1)}
            className="text-secondary hover:bg-surface-container transition-colors p-2 rounded-xl active:scale-95 duration-200"
          >
            <Icon name="ArrowRight" size={24} />
          </button>
        }
      />

      <main className="pt-6 px-4 max-w-lg mx-auto space-y-6">
        {/* Section 1: التطوير المهني */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <button 
            onClick={() => setIsProfDevOpen(!isProfDevOpen)}
            className="w-full flex justify-between items-center p-5 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="BookOpen" size={20} />
              </div>
              <h2 className="text-base font-bold text-on-surface font-headline">التطوير المهني</h2>
            </div>
            <Icon 
              name={isProfDevOpen ? "ChevronUp" : "ChevronDown"} 
              size={20} 
              className="text-secondary" 
            />
          </button>

          {isProfDevOpen && (
            <div className="p-5 border-t border-surface-container bg-surface-container-lowest/50 space-y-4">
              {profDevEntries.map((entry, index) => (
                <div key={entry.id} className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-3 relative">
                  <div className="absolute top-3 right-3 text-xs font-bold text-outline">
                    دورة #{index + 1}
                  </div>
                  
                  <div className="pt-4">
                    <label className="block text-xs font-bold text-secondary mb-1">اسم الدورة</label>
                    <input 
                      type="text" 
                      value={entry.name}
                      onChange={(e) => updateProfDevEntry(entry.id, 'name', e.target.value)}
                      placeholder="أدخل اسم الدورة التدريبية"
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">الدور</label>
                      <select
                        value={entry.role}
                        onChange={(e) => updateProfDevEntry(entry.id, 'role', e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                      >
                        <option value="" disabled>اختر الدور</option>
                        <option value="منفذ">منفذ</option>
                        <option value="مستفيد">مستفيد</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">عدد الساعات</label>
                      <input 
                        type="number" 
                        value={entry.hours}
                        onChange={(e) => updateProfDevEntry(entry.id, 'hours', e.target.value ? Number(e.target.value) : '')}
                        placeholder="الساعات"
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex justify-end">
                    {entry.pendingFile || entry.document_url ? (
                       <div className="flex items-center gap-2">
                          <span className="text-xs text-primary font-bold">تم إرفاق المشهد</span>
                          <button onClick={() => handleDeleteFile('course', entry.id, !!entry.pendingFile)} className="text-error p-1 bg-error/10 rounded-full">
                            <Icon name="Trash2" size={14} />
                          </button>
                       </div>
                    ) : (
                      <button onClick={() => triggerFileInput('course', entry.id)} className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                        <Icon name="Paperclip" size={16} />
                        <span>إرفاق المشهد</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Button */}
              {profDevEntries.length < MAX_ENTRIES && (
                <button 
                  onClick={addProfDevEntry}
                  className="w-full border-2 border-dashed border-outline-variant/50 hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon name="Plus" size={18} />
                  </div>
                  <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">إضافة دورة جديدة</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Section 2: شهادات الشكر */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <button 
            onClick={() => setIsCertificatesOpen(!isCertificatesOpen)}
            className="w-full flex justify-between items-center p-5 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Icon name="Award" size={20} />
              </div>
              <h2 className="text-base font-bold text-on-surface font-headline">شهادات الشكر والتقدير</h2>
            </div>
            <Icon 
              name={isCertificatesOpen ? "ChevronUp" : "ChevronDown"} 
              size={20} 
              className="text-secondary" 
            />
          </button>

          {isCertificatesOpen && (
            <div className="p-5 border-t border-surface-container bg-surface-container-lowest/50 space-y-4">
              {certificateEntries.map((entry, index) => (
                <div key={entry.id} className="bg-white p-4 rounded-xl border border-surface-container shadow-sm space-y-3 relative">
                  <div className="absolute top-3 right-3 text-xs font-bold text-outline">
                    شهادة #{index + 1}
                  </div>
                  
                  <div className="pt-4">
                    <label className="block text-xs font-bold text-secondary mb-1">اسم الشهادة / موضوعها</label>
                    <input 
                      type="text" 
                      value={entry.name}
                      onChange={(e) => updateCertificateEntry(entry.id, 'name', e.target.value)}
                      placeholder="أدخل موضوع الشهادة"
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex justify-end">
                    {entry.pendingFile || entry.document_url ? (
                       <div className="flex items-center gap-2">
                          <span className="text-xs text-orange-500 font-bold">تم إرفاق الشهادة</span>
                          <button onClick={() => handleDeleteFile('certificate', entry.id, !!entry.pendingFile)} className="text-error p-1 bg-error/10 rounded-full">
                            <Icon name="Trash2" size={14} />
                          </button>
                       </div>
                    ) : (
                      <button onClick={() => triggerFileInput('certificate', entry.id)} className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 px-4 py-2 rounded-lg transition-colors">
                        <Icon name="Paperclip" size={16} />
                        <span>إرفاق الشهادة</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Button */}
              {certificateEntries.length < MAX_ENTRIES && (
                <button 
                  onClick={addCertificateEntry}
                  className="w-full border-2 border-dashed border-outline-variant/50 hover:border-orange-500 hover:bg-orange-500/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Icon name="Plus" size={18} />
                  </div>
                  <span className="text-sm font-bold text-secondary group-hover:text-orange-500 transition-colors">إضافة شهادة جديدة</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Action Button */}
        <div className="pt-4 pb-8">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-base shadow-lg hover:bg-primary/90 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>حفظ التغييرات</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
