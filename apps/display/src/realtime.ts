import { createClient } from '@supabase/supabase-js';
import type { MatchState } from '@pkg/types';

export function channelKey(org: string, matchId: string, token: string){ return `match:${org}:${matchId}:${token}`; }
export function createSupa(){
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  
  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not configured. Please set up your Supabase project URL in the .env file.');
  }
  
  if (!anon) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured. Please set up your Supabase anon key in the .env file.');
  }
  
  return createClient(url, anon, { auth: { persistSession: false } });
}
export function connectDisplay(org: string, matchId: string, token: string, onState: (state: MatchState, info?: any)=>void){
  const supa = createSupa();
  const channelName = channelKey(org, matchId, token);
  console.log('Display - Connexion au canal:', channelName);
  
  const ch = supa.channel(channelKey(org, matchId, token), { config: { broadcast: { ack: true } } });
  
  ch.on('broadcast', { event: 'state' }, (p) => {
    console.log('Display - Message reçu:', p);
    const { state, info } = p.payload as any;
    onState(state, info);
  });
  
  ch.subscribe(status => {
    console.log('Display - Statut de souscription:', status);
    if (status === 'SUBSCRIBED') {
      console.log('Display - Envoi du message hello');
      ch.send({ type: 'broadcast', event: 'hello', payload: { want: 'state' } });
    }
  });
  
  return { close: () => { supa.removeChannel(ch); } };
}
