import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Icon } from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface ProfDevEntry {
  id: string;
  name: string;
  role: 'منفذ' | 'مستفيد' | '';
  hours: number | '';
}

interface CertificateEntry {
  id: string;
  name: string;
}

export default function StaffPortfolioScreen() {
  const navigate = useNavigate();

  // Expandable sections state
  const [isProfDevOpen, setIsProfDevOpen] = useState(true);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);

  // Form entries state
  const [profDevEntries, setProfDevEntries] = useState<ProfDevEntry[]>([
    { id: '1', name: '', role: '', hours: '' }
  ]);
  const [certificateEntries, setCertificateEntries] = useState<CertificateEntry[]>([
    { id: '1', name: '' }
  ]);

  const addProfDevEntry = () => {
    setProfDevEntries([...profDevEntries, { id: Date.now().toString(), name: '', role: '', hours: '' }]);
  };

  const updateProfDevEntry = (id: string, field: keyof ProfDevEntry, value: any) => {
    setProfDevEntries(profDevEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const addCertificateEntry = () => {
    setCertificateEntries([...certificateEntries, { id: Date.now().toString(), name: '' }]);
  };

  const updateCertificateEntry = (id: string, field: keyof CertificateEntry, value: any) => {
    setCertificateEntries(certificateEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
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
                    <button className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                      <Icon name="Paperclip" size={16} />
                      <span>إرفاق المشهد</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Button */}
              <button 
                onClick={addProfDevEntry}
                className="w-full border-2 border-dashed border-outline-variant/50 hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon name="Plus" size={18} />
                </div>
                <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">إضافة دورة جديدة</span>
              </button>
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
                    <button className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 px-4 py-2 rounded-lg transition-colors">
                      <Icon name="Paperclip" size={16} />
                      <span>إرفاق الشهادة</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Button */}
              <button 
                onClick={addCertificateEntry}
                className="w-full border-2 border-dashed border-outline-variant/50 hover:border-orange-500 hover:bg-orange-500/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Icon name="Plus" size={18} />
                </div>
                <span className="text-sm font-bold text-secondary group-hover:text-orange-500 transition-colors">إضافة شهادة جديدة</span>
              </button>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
