import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)) ||
  'https://qjnrtcwlmngytnzhqmat.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  'sb_publishable_y--2nsFQP-R7aYvYK1ap3A_YUtriAIv';

export const createClient = () => {
  return createSupabaseClient(supabaseUrl!, supabaseKey!);
};

export const supabase = createClient();
