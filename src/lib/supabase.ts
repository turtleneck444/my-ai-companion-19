import { createClient } from '@supabase/supabase-js';

// UPDATED: Use the correct Supabase credentials
const url = "https://bzfgvdzgdjldpybrthan.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Zmd2ZHpnZGpsZHB5YnJ0aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDU4OTgsImV4cCI6MjA3NDcyMTg5OH0.xgEW4R7gE45kLFEbHzerc_Vmkyfuby3IU9sr2RsYYjs";

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
