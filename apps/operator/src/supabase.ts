import { createClient } from '@supabase/supabase-js';

console.log('🔧 Supabase - Initialisation du client');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔑 Supabase - Configuration:', { 
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MANQUANT', 
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ MANQUANT' 
});

if (!supabaseUrl) {
  console.error('❌ Supabase - VITE_SUPABASE_URL manquant dans .env');
  throw new Error('VITE_SUPABASE_URL is required. Please check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('❌ Supabase - VITE_SUPABASE_ANON_KEY manquant dans .env');
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please check your .env file.');
}

console.log('✅ Supabase - Création du client');
export const supa = createClient(supabaseUrl, supabaseAnonKey);
console.log('🚀 Supabase - Client créé avec succès');