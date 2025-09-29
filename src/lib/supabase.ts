import { createClient } from '@supabase/supabase-js';

// Use your Supabase credentials directly
const url = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

// Enhanced validation for Supabase configuration
const isValidUrl = url && url.length > 0 && (url.startsWith('https://') || url.includes('supabase.co'));
const isValidKey = anonKey && anonKey.length > 40; // Supabase anon keys are typically longer

export const isSupabaseConfigured = Boolean(isValidUrl && isValidKey);

// Create Supabase client with enhanced configuration
export const supabase = createClient(url, anonKey, {
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
});

// Debug logging for configuration
console.log('🔧 Supabase Configuration Debug:');
console.log('URL Present:', !!url);
console.log('URL Valid:', isValidUrl);
console.log('Key Present:', !!anonKey);
console.log('Key Valid:', isValidKey);
console.log('Configured:', isSupabaseConfigured);
console.log('Supabase client created:', !!supabase);
