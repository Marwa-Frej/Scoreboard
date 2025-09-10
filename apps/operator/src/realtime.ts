import { createClient } from '@supabase/supabase-js';
import type { MatchState } from '@pkg/types';
import type { BroadcastPayload } from '@pkg/logic';

export function channelKey(org: string, matchId: string, token: string){ return `match:${org}:${matchId}:${token}`; }
export function createSupa(){
  return createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, { auth: { persistSession: true } });
}
  
  if (!url || url === 'https://your-project-ref.supabase.co') {
    throw new Error('VITE_SUPABASE_URL is not configured. Please set up your Supabase project URL in the .env file.');
  }
  
  if (!anon || anon === 'your-anon-key') {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured. Please set up your Supabase anon key in the .env file.');
  }
  
export function createOperatorChannel(org: string, matchId: string, token: string, onHello:()=>void, onAck?:()=>void){
  const supa = createSupa();
  const ch = supa.channel(channelKey(org, matchId, token), { config: { broadcast: { ack: true }, presence: { key: 'operator' } } });
  ch.on('broadcast', { event: 'hello' }, (_p)=>{ onHello(); });
  ch.subscribe((status)=>{ if (status==='SUBSCRIBED') onAck?.(); });
  return {
    publish(state: MatchState, info: any){
      const payload: BroadcastPayload = { state, info, t: Date.now() };
      ch.send({ type: 'broadcast', event: 'state', payload });
    },
    close(){ supa.removeChannel(ch); }
  }
}
