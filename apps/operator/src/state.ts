import type { MatchState, Sport } from '@pkg/types';
import { initStateForSport, defaultClockForSport } from '@pkg/logic';

export function initMatchState(key: string, sport: Sport): MatchState {
  return initStateForSport(key, sport);
}

export function reduce(state: MatchState, action: { type: string; payload?: any }): MatchState {
  const s = JSON.parse(JSON.stringify(state)) as MatchState;
  const meta: any = s.meta || {};
  switch (action.type) {
    case 'sport:set': {
      const next = initStateForSport(s.matchId, action.payload?.sport || s.sport);
      next.score = s.score;
      return next;
    }
    case 'clock:start': s.clock.running = true; return s;
    case 'clock:stop': s.clock.running = false; return s;
    case 'clock:set': s.clock.remainingMs = Math.max(0, Number(action.payload?.remainingMs || s.clock.remainingMs)); return s;
    case 'period:next': s.clock.period += 1; return s;
    case 'period:prev': s.clock.period = Math.max(1, s.clock.period - 1); return s;
    case 'score:inc': s.score[action.payload?.team || 'home'] += action.payload?.amount || 1; return s;
    case 'score:dec': s.score[action.payload?.team || 'home'] = Math.max(0, s.score[action.payload?.team || 'home'] - (action.payload?.amount || 1)); return s;
    case 'clock:reset': { const def = defaultClockForSport(s.sport); s.clock.remainingMs = def.remainingMs; s.clock.durationSec = def.durationSec; return s; }
    // VB
    case 'vb:init': return initStateForSport(s.matchId, 'volleyball');
    case 'vb:point': { const t = action.payload?.team || 'home'; s.score[t] += 1; return s; }
    case 'vb:serve': { meta.serve = action.payload?.team || 'home'; s.meta = meta; return s; }
    case 'vb:timeout': { const t = action.payload?.team || 'home'; const cur = (meta.timeouts?.[t]||0); const maxT = meta.maxTimeoutsPerSet ?? 2; meta.timeouts[t] = Math.min(maxT, cur + 1); s.meta = meta; return s; }
    case 'vb:nextSet': { const target = meta.currentSet === Math.ceil((meta.bestOf||5)/1) ? (meta.tieBreakPoints ?? 15) : (meta.pointsToWin ?? 25); const lead = Math.abs(s.score.home - s.score.away);
      if ((s.score.home >= target || s.score.away >= target) && lead >= (meta.winBy||2)) { if (s.score.home > s.score.away) meta.setsWon.home++; else meta.setsWon.away++; meta.currentSet++; s.score = { home:0, away:0 }; meta.timeouts = { home:0, away:0 }; } s.meta = meta; return s; }
    // FB
    case 'fb:init': return initStateForSport(s.matchId, 'football');
    case 'fb:goal': { const t = action.payload?.team || 'home'; s.score[t]+=1; return s; }
    case 'fb:card': { const {team='home', color='yellow'} = action.payload||{}; if (color==='yellow' || color==='red'){ meta.cards[team][color] = (meta.cards[team][color]||0)+1; } s.meta = meta; return s; }
    case 'fb:stoppage': { const { minutes=0 } = action.payload||{}; meta.stoppageMin = minutes; s.meta = meta; return s; }
    case 'fb:so:start': { meta.shootout = { inProgress:true, home:[], away:[] }; s.meta = meta; return s; }
    case 'fb:so:record': { const { team='home', res='G' } = action.payload||{}; if (!meta.shootout) meta.shootout = { inProgress:true, home:[], away:[] }; meta.shootout[team].push(res==='G'?'G':'M'); s.meta = meta; return s; }
    // HB
    case 'hb:init': return initStateForSport(s.matchId, 'handball');
    case 'hb:timeout': { const {team='home'} = action.payload||{}; const cur = meta.timeouts[team]||0; const maxT = meta.timeouts.maxPerTeam||3; meta.timeouts[team] = Math.min(maxT, cur+1); s.meta = meta; return s; }
    case 'hb:susp': { const {team='home', minutes=2} = action.payload||{}; meta.suspensions[team] = meta.suspensions[team]||[]; meta.suspensions[team].push({ remainingMs: minutes*60*1000 }); s.meta = meta; return s; }
    // BB
    case 'bb:init': return initStateForSport(s.matchId, 'basket');
    case 'bb:foul': { const {team='home', index=0} = action.payload||{}; const p = meta.roster[team][index]; if (p){ p.fouls = (p.fouls||0)+1; meta.teamFouls[team] = (meta.teamFouls[team]||0)+1; } s.meta = meta; return s; }
    case 'bb:tf:reset': { meta.teamFouls={home:0,away:0}; s.meta = meta; return s; }
    case 'bb:to': { const {team='home'} = action.payload||{}; meta.timeoutsLeft[team] = Math.max(0, (meta.timeoutsLeft[team]||0)-1); s.meta = meta; return s; }
    case 'bb:shot:start': { meta.shotRunning = true; s.meta = meta; return s; }
    case 'bb:shot:stop': { meta.shotRunning = false; s.meta = meta; return s; }
    case 'bb:shot:reset24': { meta.shotClockMs = 24_000; s.meta = meta; return s; }
    case 'bb:shot:reset14': { meta.shotClockMs = 14_000; s.meta = meta; return s; }
    case 'bb:shot:set': { const v = Math.max(0, Number(action.payload?.ms||0)); meta.shotClockMs = v; s.meta = meta; return s; }
    // HI
    case 'hi:init': return initStateForSport(s.matchId, 'hockey_ice');
    case 'hi:penalty': { const {team='home', minutes=2} = action.payload||{}; meta.penalties[team]=meta.penalties[team]||[]; meta.penalties[team].push({ minutes, remainingMs: minutes*60*1000 }); s.meta = meta; return s; }
    // HF
    case 'hf:init': return initStateForSport(s.matchId, 'hockey_field');
    case 'hf:card': { const {team='home', color='green'} = action.payload||{}; if (meta.cards[team][color] != null) meta.cards[team][color] += 1; if (color==='green'||color==='yellow'){ const minutes = color==='green' ? 2 : 5; meta.suspensions[team].push({ color, remainingMs: minutes*60*1000 }); } s.meta = meta; return s; }
  }
  return s;
}
