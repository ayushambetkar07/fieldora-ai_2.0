import { supabase } from './dist/config/supabase.js';

async function check() {
  console.log('--- Checking Supabase reviews & user_trust_scores tables ---');
  const { data: revs, error: revErr } = await supabase.from('reviews').select('*');
  console.log('Reviews table result:', { count: revs?.length, error: revErr, sample: revs });

  const { data: scores, error: scoreErr } = await supabase.from('user_trust_scores').select('*');
  console.log('User trust scores result:', { count: scores?.length, error: scoreErr, sample: scores });
  process.exit(0);
}

check().catch(err => {
  console.error('Error checking db:', err);
  process.exit(1);
});
