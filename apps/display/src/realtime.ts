import { createClient } from '@supabase/supabase-js';
import type { MatchState } from '@pkg/types';

export function channelKey(org: string, matchId: string, token: string){ return `match:${org}:${matchId}:${token}`; }
export function createSupa(){
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return createClient(url, anon, { auth: { persistSession: false } });
}
export function connectDisplay(org: string, matchId: string, token: string, onState: (state: MatchState, info?: any)=>void){
  const supa = createSupa();
  const ch = supa.channel(channelKey(org, matchId, token), { config: { broadcast: { ack: true } } });
  ch.on('broadcast', { event: 'state' }, (p) => {
    const { state, info } = p.payload as any;
    onState(state, info);
  });
  ch.subscribe(status => {
    if (status === 'SUBSCRIBED') ch.send({ type: 'broadcast', event: 'hello', payload: { want: 'state' } });
  });
  return { close: () => { supa.removeChannel(ch); } };
}
