import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://skqvrpogbsxhnlzgnzko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8'
);
// Need to login as admin to update (RLS requires auth)
async function run() {
  await supabase.auth.signInWithPassword({ email: 'escuelafclomiranda@gmail.com', password: 'lomiranda2003' });
  const { error } = await supabase.from('live_config').update({ is_live: false }).eq('id', 'current');
  console.log(error ? 'Error: ' + error.message : '✅ is_live = false');
}
run();
