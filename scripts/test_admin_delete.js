import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skqvrpogbsxhnlzgnzko.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'escuelafclomiranda@gmail.com',
    password: 'lomiranda2003'
  });
  
  if (authErr) { console.log(authErr); return; }

  // 1. Get a skin id
  const { data: skins } = await supabase.from('skins').select('id').limit(1);
  if (!skins || skins.length === 0) return console.log('no skin');
  const skin = skins[0];

  console.log('Got skin:', skin.id);

  // 2. Try delete
  const { data, error } = await supabase.from('skins').delete().eq('id', skin.id).select();
  console.log('Delete result error:', error);
  console.log('Delete return data:', data); // if RLS fails, data is usually []
}

check();
