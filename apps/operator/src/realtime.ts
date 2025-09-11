import { createClient } from '@supabase/supabase-js';
import type { MatchState } from '@pkg/types';
import type { BroadcastPayload } from '@pkg/logic';

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
  
  return createClient(url, anon, { auth: { persistSession: true } });
}
  
export function createOperatorChannel(org: string, matchId: string, token: string, onHello:()=>void, onAck?:()=>void){
  const supa = createSupa();
  const channelName = channelKey(org, matchId, token);
  console.log('Operator - Création du canal:', channelName);
  
  const ch = supa.channel(channelKey(org, matchId, token), { config: { broadcast: { ack: true }, presence: { key: 'operator' } } });
  
  ch.on('broadcast', { event: 'hello' }, (p) => { 
    console.log('Operator - Message hello reçu:', p);
    onHello(); 
  });
  
  ch.subscribe((status) => { 
    console.log('Operator - Statut de souscription:', status);
    if (status === 'SUBSCRIBED') onAck?.(); 
  });
  
  return {
    publish(state: MatchState, info: any){
      console.log('Operator - Publication de l\'état:', { state, info });
      const payload: BroadcastPayload = { state, info, t: Date.now() };
      ch.send({ type: 'broadcast', event: 'state', payload });
    },
    close(){ 
      console.log('Operator - Fermeture du canal');
      supa.removeChannel(ch); 
    }
  }
}
