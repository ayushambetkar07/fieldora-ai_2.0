import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';
dotenv.config();
// Ensure global WebSocket exists in Node.js serverless runtimes
if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
    globalThis.WebSocket = WebSocket;
}
const supabaseUrl = process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://qjnrtcwlmngytnzhqmat.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_y--2nsFQP-R7aYvYK1ap3A_YUtriAIv';
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
