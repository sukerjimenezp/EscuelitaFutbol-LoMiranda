import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skqvrpogbsxhnlzgnzko.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Starting login block check...");
  const start = Date.now();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'escuelafclomiranda@gmail.com',
    password: 'lomiranda2003'
  });
  const elapsed = Date.now() - start;
  console.log(`Elapsed time to fail/success: ${elapsed}ms`);
  if (error) {
    console.log("Error:", error?.message);
  } else {
    console.log("Success! user id:", data.user.id);
  }
}
check();
