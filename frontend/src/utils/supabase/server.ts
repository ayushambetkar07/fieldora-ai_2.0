import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://qjnrtcwlmngytnzhqmat.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  'sb_publishable_y--2nsFQP-R7aYvYK1ap3A_YUtriAIv';

export const createClient = () => {
  return createSupabaseClient(supabaseUrl!, supabaseKey!);
};
