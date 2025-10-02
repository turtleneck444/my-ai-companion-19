import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bzfgvdzgdjldpybrthan.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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
console.log('URL Valid:', supabaseUrl.includes('supabase.co'));
console.log('Key Present:', !!anonKey);
console.log('Key Valid:', anonKey.length > 0);
console.log('Configured:', !!supabaseUrl && !!anonKey);
console.log('Supabase client created:', !!supabase);
