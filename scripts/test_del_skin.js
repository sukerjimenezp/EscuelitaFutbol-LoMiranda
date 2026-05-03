import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skqvrpogbsxhnlzgnzko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8'
);

async function testDelete() {
  // Try to authenticate as admin using the credential if possible? Or maybe we can't because we don't have the password.
  // We'll just fetch a skin ID first.
  const { data: skins } = await supabase.from('skins').select('id, name').limit(1);
  if (!skins || skins.length === 0) {
    console.log('No skins found.');
    return;
  }
  
  const skin = skins[0];
  console.log(`Attempting to delete skin: ${skin.name} (${skin.id}) using anon key...`);
  
  const { error } = await supabase.from('skins').delete().eq('id', skin.id);
  console.log('Resulting Error:', error);
}

testDelete();
