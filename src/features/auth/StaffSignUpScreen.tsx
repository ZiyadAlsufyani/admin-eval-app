import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';

export default function StaffSignUpScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill email if provided via invitation link query param
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Step 1: Fire the Atomic Trigger Payload
      const { data: userAuth, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'staff'
          }
        }
      });

      if (authError) throw authError;

      // Check if Email Confirmation is enforcing a lock
      if (!userAuth.session) {
        setFullName('');
        setEmail('');
        setPassword('');
        setErrorMsg('تم قبول الدعوة! يرجى مراجعة بريدك الإلكتروني لتفعيل حسابك قبل تسجيل الدخول.');
        return; 
      }

      // Automatically navigate if confirmation is off
      navigate('/');
    } catch (error: any) {
      console.error('Signup Error:', error.message);
      setErrorMsg(error.message || 'حدث خطأ غير متوقع أثناء استهلاك الدعوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center selection:bg-primary-container selection:text-on-primary-container" dir="rtl">
      <header className="w-full top-0 sticky z-50 bg-surface flex flex-row-reverse justify-between items-center px-4 py-3 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <Icon name="Users" size={28} className="text-secondary" />
          <span className="text-lg font-bold tracking-tighter text-secondary">بوابة المعلمين</span>
        </div>
      </header>

      <main className="w-full max-w-md px-6 pt-12 flex flex-col flex-grow">
        <section className="mb-10 text-right">
          <h1 className="text-[2.5rem] font-extrabold tracking-tight text-on-surface leading-[1.1] mb-2 font-headline">
            قبول الدعوة
          </h1>
          <p className="text-secondary text-sm leading-relaxed">
            أنشئ حسابك كعضو في الطاقم للانضمام إلى منصة التقييم الخاصة بمدرستك.
          </p>
        </section>

        <form onSubmit={handleSignup} className="space-y-6">
          {errorMsg && (
            <div className="bg-error-container text-error text-sm font-semibold p-4 rounded-xl border border-error/20 flex gap-2 items-center">
              <Icon name="AlertTriangle" size={18} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">الاسم الكامل</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all duration-300">
              <input 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="الاسم الرباعي للعرض" 
                type="text"
              />
              <Icon name="User" size={20} className="absolute right-4 text-outline group-focus-within:text-secondary transition-colors duration-300" />
            </div>
          </div>

          {/* Email Field (Pre-filled logic applied) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">البريد الإلكتروني المخصص للدعوة</label>
            <div className="relative flex items-center bg-surface-container-highest border border-outline-variant/50 rounded-xl opacity-60 cursor-not-allowed transition-all duration-300">
              <input 
                required 
                readOnly
                value={email}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-bold outline-none cursor-not-allowed" 
                placeholder="example@school.com" 
                type="email"
                dir="ltr"
              />
              <Icon name="Lock" size={20} className="absolute right-4 text-outline" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">إنشاء كلمة مرور جديدة</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all duration-300">
              <input 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="••••••••" 
                type="password"
                dir="ltr"
              />
              <Icon name="Lock" size={20} className="absolute right-4 text-outline group-focus-within:text-secondary transition-colors duration-300" />
            </div>
          </div>

          <div className="pt-6">
            <button 
              disabled={isSubmitting}
              className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 active:scale-95 transition-all duration-200 text-lg flex items-center justify-center gap-2 hover:bg-tertiary disabled:opacity-70 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>جاري التحقق...</>
              ) : (
                <>
                  تأكيد الحساب والانضمام
                  <Icon name="ArrowLeft" size={20} className="mr-1" />
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-8 pb-8 text-center border-t border-outline-variant/10">
          <p className="text-secondary text-sm font-medium">
            تأكد من أنك تستخدم نفس البريد المرسل إليه هذه الدعوة. إذا كنت تملك حساباً مسبقاً،{' '}
            <Link to="/login" className="text-secondary font-bold hover:underline">سجل الدخول هنا</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
