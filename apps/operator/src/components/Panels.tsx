import React from 'react';
import type { MatchState } from '@pkg/types';

const Row = ({children}:{children:any}) => <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>{children}</div>;
export function Panel({state, send}:{state:MatchState, send:(a:string,p?:any)=>void}){
  switch(state.sport){
    case 'football': return <FootballPanel send={send}/>;
    case 'handball': return <HandballPanel send={send}/>;
    case 'basket': return <BasketPanel state={state} send={send}/>;
    case 'hockey_ice': return <HockeyIcePanel send={send}/>;
    case 'hockey_field': return <HockeyFieldPanel send={send}/>;
    case 'volleyball': return <VolleyballPanel send={send}/>;
    case 'basic':
    default: return <BasicPanel send={send}/>;
  }
}
function BasicPanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row>
    <button onClick={()=>send('clock:start')}>▶</button><button onClick={()=>send('clock:stop')}>⏸</button><button onClick={()=>send('clock:reset')}>⟲</button><button onClick={()=>send('period:next')}>Période +1</button>
    <button onClick={()=>send('score:inc',{team:'home'})}>Home +1</button><button onClick={()=>send('score:dec',{team:'home'})}>Home −1</button><button onClick={()=>send('score:inc',{team:'away'})}>Away +1</button><button onClick={()=>send('score:dec',{team:'away'})}>Away −1</button>
  </Row>;
}
function FootballPanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row>
    <button onClick={()=>send('fb:init')}>Init Football</button><button onClick={()=>send('fb:goal',{team:'home'})}>But Home</button><button onClick={()=>send('fb:goal',{team:'away'})}>But Away</button>
    <button onClick={()=>send('fb:card',{team:'home',color:'yellow'})}>🟨 H</button><button onClick={()=>send('fb:card',{team:'home',color:'red'})}>🟥 H</button>
    <button onClick={()=>send('fb:card',{team:'away',color:'yellow'})}>🟨 A</button><button onClick={()=>send('fb:card',{team:'away',color:'red'})}>🟥 A</button>
    <button onClick={()=>send('fb:stoppage',{minutes:1})}>+1'</button><button onClick={()=>send('fb:stoppage',{minutes:0})}>+0'</button>
    <button onClick={()=>send('fb:so:start')}>Démarrer TAB</button><button onClick={()=>send('fb:so:record',{team:'home',res:'G'})}>TAB H ✅</button><button onClick={()=>send('fb:so:record',{team:'home',res:'M'})}>TAB H ❌</button><button onClick={()=>send('fb:so:record',{team:'away',res:'G'})}>TAB A ✅</button><button onClick={()=>send('fb:so:record',{team:'away',res:'M'})}>TAB A ❌</button>
  </Row>;
}
function HandballPanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row>
    <button onClick={()=>send('hb:init')}>Init Handball</button><button onClick={()=>send('hb:timeout',{team:'home'})}>TO Home</button><button onClick={()=>send('hb:timeout',{team:'away'})}>TO Away</button>
    <button onClick={()=>send('hb:susp',{team:'home',minutes:2})}>2' Home</button><button onClick={()=>send('hb:susp',{team:'away',minutes:2})}>2' Away</button>
  </Row>;
}
function BasketPanel({state, send}:{state:MatchState, send:(a:string,p?:any)=>void}){
  const meta:any = (state as any).meta || {};
  return <div style={{display:'grid', gap:8}}>
    <Row><button onClick={()=>send('bb:init')}>Init Basket</button><button onClick={()=>send('bb:tf:reset')}>Reset Team Fouls</button><button onClick={()=>send('bb:to',{team:'home'})}>TO Home</button><button onClick={()=>send('bb:to',{team:'away'})}>TO Away</button></Row>
    <Row><strong>24s</strong><button onClick={()=>send('bb:shot:start')}>▶</button><button onClick={()=>send('bb:shot:stop')}>⏸</button><button onClick={()=>send('bb:shot:reset24')}>⟲ 24</button><button onClick={()=>send('bb:shot:reset14')}>⟲ 14</button></Row>
    <div>Fautes joueurs (Home): {meta.roster?.home?.map((p:any,i:number)=>(<button key={i} onClick={()=>send('bb:foul',{team:'home', index:i})}>#{p.num} {p.fouls}</button>))}</div>
    <div>Fautes joueurs (Away): {meta.roster?.away?.map((p:any,i:number)=>(<button key={i} onClick={()=>send('bb:foul',{team:'away', index:i})}>#{p.num} {p.fouls}</button>))}</div>
  </div>;
}
function HockeyIcePanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row><button onClick={()=>send('hi:init')}>Init Hockey (glace)</button><button onClick={()=>send('hi:penalty',{team:'home',minutes:2})}>2' H</button><button onClick={()=>send('hi:penalty',{team:'away',minutes:2})}>2' A</button><button onClick={()=>send('hi:penalty',{team:'home',minutes:5})}>5' H</button><button onClick={()=>send('hi:penalty',{team:'away',minutes:5})}>5' A</button></Row>;
}
function HockeyFieldPanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row><button onClick={()=>send('hf:init')}>Init Hockey (gazon)</button><button onClick={()=>send('hf:card',{team:'home',color:'green'})}>🟩 H</button><button onClick={()=>send('hf:card',{team:'home',color:'yellow'})}>🟨 H</button><button onClick={()=>send('hf:card',{team:'home',color:'red'})}>🟥 H</button><button onClick={()=>send('hf:card',{team:'away',color:'green'})}>🟩 A</button><button onClick={()=>send('hf:card',{team:'away',color:'yellow'})}>🟨 A</button><button onClick={()=>send('hf:card',{team:'away',color:'red'})}>🟥 A</button></Row>;
}
function VolleyballPanel({send}:{send:(a:string,p?:any)=>void}){
  return <Row><button onClick={()=>send('vb:init')}>Init VB</button><button onClick={()=>send('vb:serve',{team:'home'})}>Svc H</button><button onClick={()=>send('vb:serve',{team:'away'})}>Svc A</button><button onClick={()=>send('vb:timeout',{team:'home'})}>TM H</button><button onClick={()=>send('vb:timeout',{team:'away'})}>TM A</button><button onClick={()=>send('vb:point',{team:'home'})}>H +1</button><button onClick={()=>send('vb:point',{team:'away'})}>A +1</button><button onClick={()=>send('vb:nextSet')}>Fin set</button></Row>;
}
