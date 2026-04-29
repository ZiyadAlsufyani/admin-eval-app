import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvaluationDetailQuery } from '@/api/evaluations';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/layout/AppHeader';
import { Icon } from '@/components/ui/icon';
import { CATEGORY_TRANSLATIONS } from '@/constants/evaluations';

export default function EvaluationDetailScreen() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluationDetailQuery(evaluationId);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <AppHeader 
          title="تفاصيل التقييم" 
          actions={
            <button 
              onClick={() => navigate(-1)}
              className="text-secondary hover:bg-surface-container transition-colors p-2 rounded-xl active:scale-95 duration-200"
            >
              <Icon name="ArrowRight" size={24} />
            </button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <AppHeader 
          title="تفاصيل التقييم" 
          actions={
            <button 
              onClick={() => navigate(-1)}
              className="text-secondary hover:bg-surface-container transition-colors p-2 rounded-xl active:scale-95 duration-200"
            >
              <Icon name="ArrowRight" size={24} />
            </button>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-secondary mb-4">التقييم غير موجود</p>
          <button className="text-primary font-bold" onClick={() => navigate(-1)}>العودة</button>
        </div>
      </div>
    );
  }

  const { details = [], general_notes, overall_score_percentage, academic_week_number, week_start_date } = evaluation;

  // Extract all evidence files and attachments from details
  const attachments = details.flatMap((detail: any) => {
    const files = [];
    if (detail.evidence_file_url) files.push(detail.evidence_file_url);
    if (detail.attachments && Array.isArray(detail.attachments)) {
      files.push(...detail.attachments);
    }
    return files;
  }).filter(Boolean);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || url.startsWith('data:image');
  };

  const getFileUrl = (path: string) => {
    if (path.startsWith('http')) return path; // Already a full URL
    return supabase.storage.from('evaluation_evidence').getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AppHeader 
        title="تقرير التقييم" 
        actions={
          <button 
            onClick={() => navigate(-1)}
            className="text-secondary hover:bg-surface-container transition-colors p-2 rounded-xl active:scale-95 duration-200"
          >
            <Icon name="ArrowRight" size={24} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header / Main Score Card */}
        <div className="p-4">
          <div className="bg-primary text-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
            
            <p className="text-sm font-medium mb-1 z-10 opacity-90">
              أسبوع {academic_week_number} • {formatDate(week_start_date)}
            </p>
            <div className="text-5xl font-black font-headline tracking-tighter mb-2 z-10">
              {overall_score_percentage || 0}<span className="text-2xl font-bold opacity-80">%</span>
            </div>
            <p className="font-medium z-10">النتيجة النهائية</p>
          </div>
        </div>

        {/* Metrics Breakdown */}
        {details.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-sm font-bold text-on-surface mb-3 px-1">تفاصيل التقييم</h3>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
              {details.map((detail: any, index: number) => (
                <div key={detail.id || index} className={`p-4 flex items-start justify-between gap-4 ${index < details.length - 1 ? 'border-b border-outline-variant/30' : ''}`}>
                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-on-surface text-sm">
                      {CATEGORY_TRANSLATIONS[detail.category_name] || detail.category_name}
                    </span>
                    {detail.justification_notes && (
                      <span className="text-xs text-secondary mt-1">{detail.justification_notes}</span>
                    )}
                  </div>
                  <div className="bg-surface-container px-3 py-1 rounded-lg text-primary font-bold text-sm shrink-0 min-w-[70px] text-center" dir="ltr">
                    5 / {detail.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Principal's Notes */}
        {general_notes && (
          <div className="px-4 mb-6">
            <h3 className="text-sm font-bold text-on-surface mb-3 px-1">ملاحظات المدير</h3>
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-sm relative">
              <div className="absolute top-3 left-3 text-secondary/20">
                <Icon name="Quote" size={24} />
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                {general_notes}
              </p>
            </div>
          </div>
        )}

        {/* Attachments Grid */}
        {attachments.length > 0 && (
          <div className="px-4 mb-8">
            <h3 className="text-sm font-bold text-on-surface mb-3 px-1 flex items-center gap-2">
              <Icon name="Paperclip" size={16} className="text-primary" />
              المرفقات
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {attachments.map((path: string, i: number) => {
                const url = getFileUrl(path);
                if (isImage(url)) {
                  return (
                    <div 
                      key={i} 
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-outline-variant/30 relative group"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`مرفق ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Icon name="Maximize2" size={20} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="aspect-square bg-surface-container rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
                    >
                      <Icon name="FileText" size={24} className="mb-2" />
                      <span className="text-[10px] font-medium w-full text-center px-2 truncate" dir="ltr">
                        {path.split('/').pop() || 'مستند'}
                      </span>
                    </a>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-end gap-3 bg-gradient-to-b from-black/50 to-transparent">
            <a 
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <Icon name="Download" size={24} />
            </a>
            <button 
              onClick={() => setSelectedImage(null)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <Icon name="X" size={24} />
            </button>
          </div>
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4 overflow-hidden">
            <img 
              src={selectedImage} 
              alt="مرفق مكبر" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
