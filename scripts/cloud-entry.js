import { createClient } from '@supabase/supabase-js';
const config = globalThis.WordvilleCloudConfig;
const client = createClient(config.url, config.publishableKey, {auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}});
globalThis.WordvilleCloud = client;
