import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration - NO FALLBACKS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!anonKey);
}

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Debug logging
console.log('🔧 Supabase Configuration Debug:');
console.log('URL Present:', !!supabaseUrl);
console.log('URL Valid:', supabaseUrl?.includes('supabase.co'));
console.log('Key Present:', !!anonKey);
console.log('Key Valid:', anonKey?.length > 0);
console.log('Configured:', !!supabaseUrl && !!anonKey);
console.log('Supabase client created:', !!supabase);
