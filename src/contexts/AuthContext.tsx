import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
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
          
          // Note: Navigation is handled by the component that calls signIn
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in successfully');
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
      console.error('Supabase not configured');
      
      // Return error if Supabase not configured
      
      // Return error instead of demo mode
      return { error: new Error('Supabase not configured') as AuthError };
      
      // Simulate user state update immediately (no timeout)
      setUser({
        id: demoUser.id,
        email: demoUser.email,
        user_metadata: userData
      } as User);
      
      return { error: null };
    }
    
    try {
      console.log('🔐 Attempting Supabase signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth`
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
      console.error('Supabase not configured');
      
      // Return error if Supabase not configured
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
    // Clear any local state
    try {
      // Clear any local state if needed
      setUser(null);
      setSession(null);
    } catch {}

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
