import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Enhanced validation for Supabase configuration
const isValidUrl = url && url.length > 0 && (url.startsWith('https://') || url.includes('supabase.co'));
const isValidKey = anonKey && anonKey.length > 40; // Supabase anon keys are typically longer

export const isSupabaseConfigured = Boolean(isValidUrl && isValidKey);

// Create Supabase client with enhanced configuration
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'loveai-auth-token',
      },
      global: {
        headers: {
          'x-application': 'loveai-app',
        },
      },
    })
  : (null as any);

// Debug logging for configuration
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration Debug:');
  console.log('URL Present:', !!url);
  console.log('URL Valid:', isValidUrl);
  console.log('Key Present:', !!anonKey);
  console.log('Key Valid:', isValidKey);
  console.log('Configured:', isSupabaseConfigured);
  
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  }
}
