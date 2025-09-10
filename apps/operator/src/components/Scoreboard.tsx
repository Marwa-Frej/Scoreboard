import React from 'react';
import type { MatchState } from '@pkg/types';

export function Scoreboard({ state, homeName, awayName, homeLogo, awayLogo }:{ state: MatchState, homeName: string, awayName: string, homeLogo?:string|null, awayLogo?:string|null }){
  const time = fmt(state.clock.remainingMs);
  const meta:any = (state as any).meta || {};
  const fb = state.sport==='football' ? meta : null;
  const hb = state.sport==='handball' ? meta : null;
  const bb = state.sport==='basket' ? meta : null;
  const hi = state.sport==='hockey_ice' ? meta : null;
  const hf = state.sport==='hockey_field' ? meta : null;
  const vb = state.sport==='volleyball' ? meta : null;

  const hbSuspH = hb ? (hb.suspensions?.home||[]).filter((s:any)=>s.remainingMs>0).length : 0;
  const hbSuspA = hb ? (hb.suspensions?.away||[]).filter((s:any)=>s.remainingMs>0).length : 0;
  const hiPenH = hi ? (hi.penalties?.home||[]).filter((p:any)=>p.remainingMs>0).length : 0;
  const hiPenA = hi ? (hi.penalties?.away||[]).filter((p:any)=>p.remainingMs>0).length : 0;
  const ppHome = hiPenA > hiPenH; const ppAway = hiPenH > hiPenA;
  const shot = bb ? Math.ceil((bb.shotClockMs||0)/1000) : 0;
  const bonusH = bb ? ((bb.teamFouls?.home||0) >= (bb.bonusThreshold||5)) : false;
  const bonusA = bb ? ((bb.teamFouls?.away||0) >= (bb.bonusThreshold||5)) : false;
  const serveHome = vb?.serve === 'home'; const serveAway = vb?.serve === 'away';

  return (
    <div className="panel">
      <div className="row">
        <div className="team">
          {vb && <span className="badge" style={{opacity: serveHome?1:.25}}/>}
          {homeLogo ? <span className="logo"><img src={homeLogo} alt="" /></span> : <span className="logo">🏟</span>}
          {homeName} {ppHome && <span className="chip">PP</span>}
        </div>
        <div className="score">
          <span className="led huge">{pad2(state.score.home)}</span>
          <span className="led huge sep">:</span>
          <span className="led huge">{pad2(state.score.away)}</span>
        </div>
        <div className="team" style={{justifyContent:'flex-end'}}>
          {ppAway && <span className="chip">PP</span>}
          {awayName}
          {awayLogo ? <span className="logo"><img src={awayLogo} alt="" /></span> : <span className="logo">🏟</span>}
          {vb && <span className="badge" style={{opacity: serveAway?1:.25}}/>}
        </div>
      </div>
      <div className="sub">
        <div className="chip"><span className="led big">P{state.clock.period}</span></div>
        {state.sport!=='volleyball' && (<div className="chip"><span className={`led big ${state.clock.running?'blink':''}`}>{time}</span>{!state.clock.running && <span style={{opacity:.7}}>⏸</span>}</div>)}
        {fb && (<><div className="chip">H: 🟨 {fb.cards?.home?.yellow||0} • 🟥 {fb.cards?.home?.red||0}</div><div className="chip"><strong>+{fb.stoppageMin||0}'</strong></div><div className="chip">A: 🟨 {fb.cards?.away?.yellow||0} • 🟥 {fb.cards?.away?.red||0}</div>{fb.shootout?.inProgress && <div className="chip">TAB H {fb.shootout.home.filter((x:string)=>x==='G').length} : {fb.shootout.away.filter((x:string)=>x==='G').length} A</div>}</>)}
        {hb && (<><div className="chip">TO H: <span className="led med">{hb.timeouts?.home||0}/{hb.timeouts?.maxPerTeam||3}</span></div><div className="chip">2' H actives: <span className="led med">{hbSuspH}</span></div><div className="chip">TO A: <span className="led med">{hb.timeouts?.away||0}/{hb.timeouts?.maxPerTeam||3}</span></div><div className="chip">2' A actives: <span className="led med">{hbSuspA}</span></div></>)}
        {bb && (<><div className="chip">TF H: <span className="led med">{bb.teamFouls?.home||0}</span>{bonusH && <span style={{marginLeft:8}}>Bonus</span>}</div><div className="chip"><strong>⏱ {shot}</strong></div><div className="chip">TF A: <span className="led med">{bb.teamFouls?.away||0}</span>{bonusA && <span style={{marginLeft:8}}>Bonus</span>}</div></>)}
        {hi && (<><div className="chip">PEN H actives: <span className="led med">{hiPenH}</span></div><div className="chip">PEN A actives: <span className="led med">{hiPenA}</span></div></>)}
        {hf && (<><div className="chip">H cartes: 🟩 {hf.cards?.home?.green||0} 🟨 {hf.cards?.home?.yellow||0} 🟥 {hf.cards?.home?.red||0}</div><div className="chip">A cartes: 🟩 {hf.cards?.away?.green||0} 🟨 {hf.cards?.away?.yellow||0} 🟥 {hf.cards?.away?.red||0}</div></>)}
        {vb && (<><div className="chip"><strong>Sets</strong> <span className="led med">{vb.setsWon?.home||0}</span><span className="sep">:</span><span className="led med">{vb.setsWon?.away||0}</span></div><div className="chip"><strong>TM</strong> <span className="led med">{vb.timeouts?.home||0}/{vb.maxTimeoutsPerSet||2}</span><span className="sep">•</span><span className="led med">{vb.timeouts?.away||0}/{vb.maxTimeoutsPerSet||2}</span></div>{vb.technicalTO?.enabled && <div className="chip">TTO aux points {vb.technicalTO.atPoints?.join(', ')}</div>}</>)}
      </div>
    </div>
  );
}
function pad2(n:number){ return n.toString().padStart(2,'0'); }
function fmt(ms:number){ const s = Math.floor(ms/1000); const mm = Math.floor(s/60).toString().padStart(2,'0'); const ss = (s%60).toString().padStart(2,'0'); return `${mm}:${ss}`; }
