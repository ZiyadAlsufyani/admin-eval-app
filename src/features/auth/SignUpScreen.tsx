import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/ui/icon';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Step 1: Fire the Atomic Trigger Payload
      // (The Postgres handle_new_user trigger intercepts this and builds the Tenant!)
      const { data: userAuth, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            school_name: schoolName,
            role: 'principal'
          }
        }
      });

      if (authError) throw authError;

      // Check if Email Confirmation is enforcing a lock
      if (!userAuth.session) {
        setFullName('');
        setEmail('');
        setSchoolName('');
        setPassword('');
        setErrorMsg('تم إنشاء حسابك بنجاح! يرجى مراجعة صندوق الوارد (أو مجلد البريد المزعج) لتفعيل حسابك قبل تسجيل الدخول.');
        // Change the error box to a success color via local state if we want, or just let errorMsg display the success text.
        // Actually, to make it green, lets just use a generic alert. But for simplicity, reusing errorMsg works as an alert box.
        return; 
      }

      // Automatically navigate if confirmation is off
      navigate('/');
    } catch (error: any) {
      console.error('Signup Error:', error.message);
      setErrorMsg(error.message || 'حدث خطأ غير متوقع أثناء إنشاء حسابك');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center selection:bg-primary-container selection:text-on-primary-container" dir="rtl">
      {/* Floating Back Button */}
      <div className="w-full max-w-md mx-auto px-4 pt-6 flex justify-start z-50">
        <button 
          onClick={() => navigate('/login')}
          className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-xl transition-all duration-200 active:scale-95"
          title="العودة"
        >
          <Icon name="ArrowRight" size={24} />
        </button>
      </div>

      <main className="w-full max-w-md px-6 pt-4 flex flex-col flex-grow mx-auto">
        {/* Header Section */}
        <section className="mb-10 text-right">
          <h1 className="text-[2.75rem] font-extrabold tracking-tight text-on-surface leading-[1.1] mb-2 font-headline">
            إنشاء حساب
          </h1>
          <p className="text-secondary text-sm leading-relaxed">
            ابدأ رحلتك لإدارة تقييمات موظفيك بذكاء.
          </p>
        </section>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          {errorMsg && (
            <div className="bg-error-container text-error text-sm font-semibold p-4 rounded-xl border border-error/20 flex gap-2 items-center">
              <Icon name="AlertTriangle" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">الاسم الكامل</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <input 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="أدخل اسمك بالكامل" 
                type="text"
              />
              <Icon name="User" size={20} className="absolute right-4 text-outline group-focus-within:text-primary transition-colors duration-300" />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">البريد الإلكتروني</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <input 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="example@school.com" 
                type="email"
                dir="ltr"
              />
              <Icon name="Mail" size={20} className="absolute right-4 text-outline group-focus-within:text-primary transition-colors duration-300" />
            </div>
          </div>

          {/* School/Organization Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">اسم المدرسة</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <input 
                required 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="المؤسسة التعليمية" 
                type="text"
              />
              <Icon name="University" size={20} className="absolute right-4 text-outline group-focus-within:text-primary transition-colors duration-300" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-secondary mr-2 tracking-wide uppercase">كلمة المرور</label>
            <div className="relative flex items-center bg-surface-container-low border border-outline-variant/30 rounded-xl group focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <input 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-4 pr-12 text-on-surface font-medium outline-none" 
                placeholder="••••••••" 
                type="password"
                dir="ltr"
              />
              <Icon name="Lock" size={20} className="absolute right-4 text-outline group-focus-within:text-primary transition-colors duration-300" />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6">
            <button 
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all duration-200 text-lg flex items-center justify-center gap-2 hover:bg-brand-teal disabled:opacity-70 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>جاري الإنشاء...</>
              ) : (
                <>
                  إنشاء حساب
                  <Icon name="ArrowLeft" size={20} className="mr-1" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer / Switch to Login */}
        <div className="mt-8 pt-8 pb-8 text-center border-t border-outline-variant/10">
          <p className="text-secondary text-sm font-medium">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary font-bold mr-1 hover:underline active:opacity-70">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
