import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skqvrpogbsxhnlzgnzko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8'
);

async function diag() {
  console.log('=== TEST 1: categories (anon, no auth) ===');
  const t1 = Date.now();
  const { data: cats, error: catsErr } = await supabase.from('categories').select('*').order('name');
  console.log(`  Time: ${Date.now() - t1}ms`);
  console.log('  Data:', cats?.length, 'rows');
  console.log('  Error:', catsErr);

  console.log('\n=== TEST 2: profiles (anon, no auth) ===');
  const t2 = Date.now();
  const { data: profs, error: profsErr } = await supabase.from('profiles').select('category_id, role').eq('role', 'player');
  console.log(`  Time: ${Date.now() - t2}ms`);
  console.log('  Data:', profs?.length, 'rows');
  console.log('  Error:', profsErr);

  console.log('\n=== TEST 3: login ===');
  const t3 = Date.now();
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'escuelafclomiranda@gmail.com',
    password: 'lomiranda2003'
  });
  console.log(`  Time: ${Date.now() - t3}ms`);
  if (loginErr) {
    console.log('  Login error:', loginErr.message);
  } else {
    console.log('  Login success, user:', loginData.user.id);
  }

  if (loginData?.user) {
    console.log('\n=== TEST 4: categories (authenticated) ===');
    const t4 = Date.now();
    const { data: cats2, error: catsErr2 } = await supabase.from('categories').select('*').order('name');
    console.log(`  Time: ${Date.now() - t4}ms`);
    console.log('  Data:', cats2?.length, 'rows');
    console.log('  Error:', catsErr2);

    console.log('\n=== TEST 5: profiles (authenticated) ===');
    const t5 = Date.now();
    const { data: profs2, error: profsErr2 } = await supabase.from('profiles').select('category_id, role').eq('role', 'player');
    console.log(`  Time: ${Date.now() - t5}ms`);
    console.log('  Data:', profs2?.length, 'rows');
    console.log('  Error:', profsErr2);
  }

  process.exit(0);
}

diag();
