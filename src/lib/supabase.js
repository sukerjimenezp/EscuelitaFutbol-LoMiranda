import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) console.error('Supabase Error: VITE_SUPABASE_URL is undefined');
if (!supabaseAnonKey) console.error('Supabase Error: VITE_SUPABASE_ANON_KEY is undefined');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Bypass navigator.locks — prevents NavigatorLockAcquireTimeoutError
      // that causes login and queries to hang in dev (Vite HMR) and some browsers
      lock: (name, acquireTimeout, fn) => fn(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
