import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!anonKey);
  console.error('Please check your .env file or environment variables');
}

// Create Supabase client with fallback for development
export const supabase = createClient(
  supabaseUrl || 'https://bzfgvdzgdjldpybrthan.supabase.co',
  anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Zmd2ZHpnZGpsZHB5YnJ0aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDQ4NzAsImV4cCI6MjA1MTQyMDg3MH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export configuration status
export const isSupabaseConfigured = !!(supabaseUrl && anonKey);

// Debug logging
console.log('🔧 Supabase Configuration Debug:');
console.log('URL Present:', !!supabaseUrl);
console.log('URL Valid:', supabaseUrl?.includes('supabase.co'));
console.log('Key Present:', !!anonKey);
console.log('Key Valid:', anonKey?.length > 0);
console.log('Configured:', isSupabaseConfigured);
console.log('Supabase client created:', !!supabase);
