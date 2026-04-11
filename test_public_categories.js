import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skqvrpogbsxhnlzgnzko.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Checking public categories fetch...");
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  console.log("Categories Data:", data);
  console.log("Categories Error:", error);

  console.log("\nChecking profiles...");
  const { data: prof, error: profErr } = await supabase.from('profiles').select('category_id, role').eq('role', 'player');
  console.log("Profiles Data:", prof);
  console.log("Profiles Error:", profErr);
}
check();
