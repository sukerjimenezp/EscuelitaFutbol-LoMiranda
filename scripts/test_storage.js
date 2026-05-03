import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://skqvrpogbsxhnlzgnzko.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcXZycG9nYnN4aG5semduemtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTcxNTQsImV4cCI6MjA5MDk3MzE1NH0.654v5Xi0edwrmaddHc8qSWEh1ssG8tAJl5rTzuoPAW8'
);

async function test() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data);
  console.log("Error:", error);
}
test();
