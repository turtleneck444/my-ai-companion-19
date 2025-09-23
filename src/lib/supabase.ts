import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Check if the environment variables are properly configured
const isValidUrl = url && url.length > 0 && url.startsWith('https://');
const isValidKey = anonKey && anonKey.length > 0;

export const isSupabaseConfigured = Boolean(isValidUrl && isValidKey);

export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as any);
