import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://skqvrpogbsxhnlzgnzko.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Fetching profiles via anon key (might be empty due to RLS)...");
  const { data, error } = await supabase.from('profiles').select('*');
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : null);
}
check();
