import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
  console.warn('Supabase credentials are not fully configured. Database features will be disabled.');
}

// Ensure we don't pass 'undefined' string or empty string that might crash the constructor
const validUrl = (supabaseUrl && supabaseUrl !== 'undefined') ? supabaseUrl : 'https://placeholder-url.supabase.co';
const validKey = (supabaseAnonKey && supabaseAnonKey !== 'undefined') ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
