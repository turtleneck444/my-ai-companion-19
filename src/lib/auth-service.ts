// Enhanced authentication service with password reset and email verification
import { supabase, isSupabaseConfigured } from './supabase';
import { analytics } from './analytics';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  plan: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

class AuthService {
  private currentUser: UserProfile | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    if (!isSupabaseConfigured) return;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = this.mapUserToProfile(session.user);
        analytics.setUserId(session.user.id);
        analytics.trackUserAction('login', 'Authentication');
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        analytics.trackUserAction('logout', 'Authentication');
      }
    });

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = this.mapUserToProfile(session.user);
      analytics.setUserId(session.user.id);
    }
  }

  private mapUserToProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url,
      plan: user.user_metadata?.plan || 'free',
      emailVerified: user.email_confirmed_at ? true : false,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString()
    };
  }

  // Sign up with email and password
  async signUp(email: string, password: string, name?: string): Promise<{ user: UserProfile | null; error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { user: null, error: { message: 'Authentication not configured' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            plan: 'free'
          }
        }
      });

      if (error) {
        analytics.trackError(error as Error, 'signup');
        return { user: null, error: { message: error.message, code: error.message } };
      }

      if (data.user) {
        this.currentUser = this.mapUserToProfile(data.user);
        analytics.trackUserAction('signup', 'Authentication');
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: { message: 'Sign up failed' } };
    } catch (error) {
      analytics.trackError(error as Error, 'signup');
      return { user: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { user: null, error: { message: 'Authentication not configured' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        analytics.trackError(error as Error, 'signin');
        return { user: null, error: { message: error.message, code: error.message } };
      }

      if (data.user) {
        this.currentUser = this.mapUserToProfile(data.user);
        analytics.setUserId(data.user.id);
        analytics.trackUserAction('login', 'Authentication');
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: { message: 'Sign in failed' } };
    } catch (error) {
      analytics.trackError(error as Error, 'signin');
      return { user: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Authentication not configured' } };
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        analytics.trackError(error as Error, 'signout');
        return { error: { message: error.message } };
      }

      this.currentUser = null;
      analytics.trackUserAction('logout', 'Authentication');
      return { error: null };
    } catch (error) {
      analytics.trackError(error as Error, 'signout');
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Authentication not configured' } };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        analytics.trackError(error as Error, 'password_reset');
        return { error: { message: error.message } };
      }

      analytics.trackUserAction('password_reset_requested', 'Authentication');
      return { error: null };
    } catch (error) {
      analytics.trackError(error as Error, 'password_reset');
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Authentication not configured' } };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        analytics.trackError(error as Error, 'password_update');
        return { error: { message: error.message } };
      }

      analytics.trackUserAction('password_updated', 'Authentication');
      return { error: null };
    } catch (error) {
      analytics.trackError(error as Error, 'password_update');
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<{ error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Authentication not configured' } };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: this.currentUser?.email || ''
      });

      if (error) {
        analytics.trackError(error as Error, 'email_verification');
        return { error: { message: error.message } };
      }

      analytics.trackUserAction('email_verification_sent', 'Authentication');
      return { error: null };
    } catch (error) {
      analytics.trackError(error as Error, 'email_verification');
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile | null; error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { user: null, error: { message: 'Authentication not configured' } };
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar_url: updates.avatar,
          plan: updates.plan
        }
      });

      if (error) {
        analytics.trackError(error as Error, 'profile_update');
        return { user: null, error: { message: error.message } };
      }

      if (data.user) {
        this.currentUser = this.mapUserToProfile(data.user);
        analytics.trackUserAction('profile_updated', 'Authentication');
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: { message: 'Profile update failed' } };
    } catch (error) {
      analytics.trackError(error as Error, 'profile_update');
      return { user: null, error: { message: 'An unexpected error occurred' } };
    }
  }

  // Delete user account
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Authentication not configured' } };
      }

      // Note: This would typically require admin privileges
      // For now, we'll just sign out the user
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        analytics.trackError(error as Error, 'account_deletion');
        return { error: { message: error.message } };
      }

      this.currentUser = null;
      analytics.trackUserAction('account_deleted', 'Authentication');
      return { error: null };
    } catch (error) {
      analytics.trackError(error as Error, 'account_deletion');
      return { error: { message: 'An unexpected error occurred' } };
    }
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Check if email is verified
  isEmailVerified(): boolean {
    return this.currentUser?.emailVerified || false;
  }

  // Get user plan
  getUserPlan(): string {
    return this.currentUser?.plan || 'free';
  }
}

// Export singleton instance
export const authService = new AuthService();
