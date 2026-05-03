import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envStr = fs.readFileSync('.env', 'utf-8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function test() {
  const email = 'test_collision_' + Date.now() + '@lomiranda.cl';
  
  // 1. Create user
  console.log('1. Creating user:', email);
  let res = await supabase.auth.signUp({ email, password: 'password123' });
  console.log('User 1 ID:', res.data?.user?.id);
  console.log('User 1 identities length:', res.data?.user?.identities?.length);

  // 2. Try to create again
  console.log('2. Creating same user again');
  let res2 = await supabase.auth.signUp({ email, password: 'password123' });
  console.log('User 2 ID:', res2.data?.user?.id);
  console.log('User 2 identities length:', res2.data?.user?.identities?.length);
  console.log('Error:', res2.error?.message);
}

test();
