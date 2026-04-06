import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        // Because of ProtectedRoute & AuthProvider, success naturally triggers re-route logic via global state change
        navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMsg('حدث خطأ في النظام. الرجاء المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background text-on-background font-sans" dir="rtl">
      <header className="w-full pt-16 pb-12 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <img
            alt="Vertex Insight Logo"
            className="h-24 w-auto drop-shadow-[0_4px_10px_rgba(13,148,136,0.1)]"
            src="https://lh3.googleusercontent.com/aida/ADBb0uhx5ZobpNJn7NSKgv8Whxbjzplt94AeLD5vXvM4xKbw1zXpc1KcpeMjs2euWIx_GZS064e709IhLsBWa8ucEOe1bhEPZBIkWeaAq5f_BboDQ9dfxnSv8Tce5AhTOWqXoQw6ofFJ70_CTvM_cj-ebqB3yNQIyW1Ibete8lJP9Y6NFbwmu8JPu6jFybQy5bXmXXPP50J0eDeRTvS10pnHyI6e_luBwM-pGc76RDKwtWjmtOwlTJGTJ2LagOFTs6ntE8GRUEi0t5583Q"
          />
        </div>
      </header>

      <main className="w-full flex-grow flex flex-col items-center px-4">
        <div className="w-full max-w-lg bg-surface p-8 sm:p-10 rounded-[12px] border border-outline shadow-xl shadow-slate-200/50">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-on-background mb-3">مرحباً بك مجدداً</h2>
            <p className="text-on-surface-variant text-base font-light">أدخل تفاصيل حسابك للوصول إلى لوحة التحكم</p>
          </div>

          <form className="space-y-8" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-primary tracking-[0.1em] uppercase">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  className="w-full bg-transparent border-0 border-b border-outline focus:border-primary focus:ring-0 px-0 py-4 text-on-surface text-lg transition-all placeholder:text-on-surface-variant/40"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-primary tracking-[0.1em] uppercase">
                  كلمة المرور
                </label>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-transparent border-0 border-b border-outline focus:border-primary focus:ring-0 px-0 py-4 text-on-surface text-lg transition-all placeholder:text-on-surface-variant/40 pr-10"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    {!showPassword && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <div className="pt-2 text-left">
                <a className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors" href="#">
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>

            <div className="pt-8">
              <button
                className="w-full bg-primary text-white font-bold py-5 rounded-[12px] shadow-[0_10px_20px_rgba(13,148,136,0.2)] active:scale-[0.98] hover:bg-teal-700 transition-all duration-200 text-lg uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>

          {/* Call to action at screen bottom */}
          <div className="mt-auto pt-10 pb-6 text-center">
            <p className="text-sm font-medium text-secondary tracking-wide">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-primary font-bold mr-1 hover:underline active:opacity-70 transition-all">
                سجل هنا
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-10 text-center">
        <p className="text-[11px] text-on-surface-variant/60 font-medium uppercase tracking-[0.2em]">
          VERTEX INSIGHT SOLUTIONS 2024 ©
        </p>
      </footer>
    </div>
  );
}
