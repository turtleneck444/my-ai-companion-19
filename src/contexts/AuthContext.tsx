import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: any) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, skipping auth initialization');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.warn('Supabase auth error:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Redirect to /app after successful sign in
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in, redirecting to /app');
            window.location.href = '/app';
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.warn('Error setting up auth listener:', error);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    // Handle case when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, using demo mode');
      
      // Demo mode - simulate successful signup
      const demoUser = {
        id: 'demo-' + Date.now(),
        email,
        preferred_name: userData?.preferred_name || 'User',
        treatment_style: userData?.treatment_style || 'romantic'
      };
      
      // Store demo user in localStorage
      localStorage.setItem('loveai-demo-user', JSON.stringify(demoUser));
      
      // Simulate user state update
      setTimeout(() => {
        setUser({
          id: demoUser.id,
          email: demoUser.email,
          user_metadata: userData
        } as User);
      }, 100);
      
      return { error: null };
    }
    
    try {
      console.log('🔐 Attempting Supabase signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        console.error('❌ Supabase signup error:', error);
      } else {
        console.log('✅ Supabase signup successful:', data);
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Handle case when Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, checking demo mode');
      
      // Check for demo user
      const demoUserData = localStorage.getItem('loveai-demo-user');
      if (demoUserData) {
        const demoUser = JSON.parse(demoUserData);
        if (demoUser.email === email) {
          // Simulate user state update
          setTimeout(() => {
            setUser({
              id: demoUser.id,
              email: demoUser.email,
              user_metadata: {
                preferred_name: demoUser.preferred_name,
                treatment_style: demoUser.treatment_style
              },
              app_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString()
            } as unknown as User);
            
            // Redirect to /app after demo sign in
            console.log('✅ Demo user signed in, redirecting to /app');
            setTimeout(() => {
              window.location.href = '/app';
            }, 100);
          }, 100);
         
          return { error: null };
        }
      }
      
      return { error: new Error('Invalid credentials or demo user not found') as AuthError };
    }
    
    try {
      console.log('🔐 Attempting Supabase signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Supabase signin error:', error);
      } else {
        console.log('✅ Supabase signin successful:', data);
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Unexpected signin error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') as AuthError };
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
