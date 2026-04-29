import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useStaffQuery } from '@/api/staff';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import emailjs from '@emailjs/browser';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { Avatar } from '@/components/ui/Avatar';

export default function StaffManagementScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, school } = useAuth();
  const { data: staffList = [], isLoading } = useStaffQuery();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);

  const handleDeleteStaff = async (staffId: string, staffName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigation to profile
    if (!window.confirm(`هل أنت متأكد من إزالة ${staffName} من المدرسة؟`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      // Invalidate query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (err) {
      console.error('Failed to delete staff', err);
      alert('تعذر حذف الموظف');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    setInviteError('');

    try {
      // Use the authenticated user's profile to get the school_id
      if (!profile?.school_id) throw new Error('Could not identify school');

      const { error: insertErr } = await supabase
        .from('staff_invitations')
        .insert([{ email: inviteEmail, school_id: profile.school_id }]);

      if (insertErr) throw insertErr;

      // Dispatch the physical email
      const schoolName = school?.name || 'إدارة المدرسة';
      const inviteLink = `${window.location.origin}/signup/staff?email=${encodeURIComponent(inviteEmail)}`;

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: inviteEmail,
            school_name: schoolName,
            invite_link: inviteLink,
          },
          publicKey
        );
      } else {
        console.warn('EmailJS environment variables are missing. Invitation saved to database only.');
      }

      setInviteEmail('');
      setIsInviteModalOpen(false);
      alert('تم إرسال الدعوة بنجاح!');
    } catch (err) {
      console.error('Failed to send invite', err);
      setInviteError('فشل إرسال الدعوة. تأكد من البريد الإلكتروني والمحاولة مرة أخرى');
    } finally {
      setIsInviting(false);
    }
  };

  const handleWhatsAppInvite = async () => {
    setIsWhatsAppLoading(true);
    setInviteError('');

    try {
      if (!profile?.school_id) throw new Error('Could not identify school');

      // Insert generic token invite (null email)
      const { data, error: insertErr } = await supabase
        .from('staff_invitations')
        .insert([{ email: null, school_id: profile.school_id }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      const token = data.token;
      const inviteUrl = `${window.location.origin}/signup/staff?token=${token}`;
      const text = encodeURIComponent(`انضم إلى مدرستنا على تطبيق التقييم. اضغط هنا للتسجيل: ${inviteUrl}`);
      
      window.location.href = `whatsapp://send?text=${text}`;
      setIsInviteModalOpen(false);
    } catch (err) {
      console.error('Failed to generate WhatsApp invite', err);
      setInviteError('فشل إنشاء رابط الدعوة.');
    } finally {
      setIsWhatsAppLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-secondary">جاري تحميل الاداريين...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <AppHeader title="الاداريين" />

      {/* Staff List */}
      <main className="flex-1 px-4 py-6 space-y-4">
        <div className="px-2 pb-2">
          <p className="text-xl text-gray-500 font-medium">إدارة طاقم المدرسة</p>
        </div>
        {staffList.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <Icon name="Users" size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
            <p className="text-secondary font-medium text-lg">لا يوجد موظفين حالياً</p>
          </div>
        ) : (
          staffList.map((staff) => (
            <div 
              key={staff.id} 
              onClick={() => navigate(`/staff/${staff.id}`)}
              className="bg-surface rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/20 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Avatar 
                name={staff.name} 
                imageUrl={staff.avatarUrl} 
                shape="square" 
                size="md" 
              />
              
              <div className="flex-1">
                <h3 className="font-bold text-on-surface text-lg leading-tight">{staff.name}</h3>
                <p className="text-sm text-secondary tracking-wide mt-0.5">{staff.role}</p>
              </div>

              <button 
                onClick={(e) => handleDeleteStaff(staff.id, staff.name, e)}
                className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors flex-shrink-0 mr-2"
                title="إزالة الموظف"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          ))
        )}
      </main>
      
      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsInviteModalOpen(true)}
        className="fixed bottom-24 left-6 w-14 h-14 bg-vertex-teal text-white rounded-full flex items-center justify-center shadow-xl z-50 active:scale-90 transition-all duration-200"
        aria-label="إضافة موظف"
      >
        <Icon name="Plus" size={28} />
      </button>

      {/* Invitation Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-surface w-full max-w-sm rounded-[24px] p-6 shadow-2xl scale-in-95 animate-in duration-200">
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">دعوة موظف جديد</h2>
            <p className="text-sm text-secondary mb-6 leading-relaxed">أدخل البريد الإلكتروني للموظف لإرسال رابط الانضمام للمدرسة</p>
            
            <form onSubmit={handleSendInvite} className="space-y-4">
              {inviteError && (
                <div className="text-xs text-error font-medium bg-error-container p-2 rounded-lg">{inviteError}</div>
              )}
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="البريد الإلكتروني"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 text-on-surface outline-none placeholder:text-outline"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-secondary hover:bg-surface-container-low transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail}
                  className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold disabled:opacity-50 disabled:active:scale-100 hover:bg-brand-teal active:scale-[0.98] transition-all"
                >
                  {isInviting ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                </button>
              </div>
            </form>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-surface-container-highest"></div>
              <span className="flex-shrink-0 mx-4 text-on-surface-variant text-sm">أو</span>
              <div className="flex-grow border-t border-surface-container-highest"></div>
            </div>

            <button
              onClick={handleWhatsAppInvite}
              disabled={isWhatsAppLoading}
              className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98]"
            >
              {isWhatsAppLoading ? (
                <>جاري الإنشاء...</>
              ) : (
                <>
                  <Icon name="MessageCircle" size={20} />
                  دعوة عبر واتساب
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
