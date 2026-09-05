import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjnrtcwlmngytnzhqmat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbnJ0Y3dsbW5neXRuemhxbWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTk3OTMsImV4cCI6MjEwMzc3NTc5M30.9ushdv8tdrccv4R0E5l7q_QLD2IdynSW-gVT-XovPwk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('produce_listings').select('*');
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS, fetched rows:', data.length);
  }
}
test();
