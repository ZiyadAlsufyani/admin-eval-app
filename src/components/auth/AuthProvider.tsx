import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  school: any | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  school: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [school, setSchool] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full nested SaaS context whenever a user is detected
  const loadSaaSContext = async (activeUser: User | null) => {
    if (!activeUser) {
      setProfile(null);
      setSchool(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .single();
        
      if (profileData && profileData.school_id) {
        setProfile(profileData);
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profileData.school_id)
          .single();
        setSchool(schoolData);
      }
    } catch (error) {
      console.error('Error fetching structural auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadSaaSContext(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(true);
      loadSaaSContext(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, school, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
