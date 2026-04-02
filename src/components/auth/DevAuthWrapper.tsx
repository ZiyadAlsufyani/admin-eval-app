import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function DevAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function silentLogin() {
      if (!import.meta.env.DEV) {
        setIsAuthenticated(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Attempt regular login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@vertex.com',
          password: 'password123',
        });
        if (signInError) {
          console.warn('Login failed, attempting native Dev Auto-Signup...');
          await supabase.auth.signUp({
            email: 'admin@vertex.com',
            password: 'password123',
            options: {
              data: { full_name: 'المدير خالد', role: 'principal', school_id: 'c1a4db5a-2e45-4206-a578-8ba94dd8bfdf', job_title: 'مدير مدرسة' }
            }
          });
          await supabase.auth.signInWithPassword({ email: 'admin@vertex.com', password: 'password123' });
        }
      }
      setIsAuthenticated(true);
    }

    silentLogin();
  }, []);

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-bold">جاري المصادقة...</div>;
  }

  return <>{children}</>;
}
