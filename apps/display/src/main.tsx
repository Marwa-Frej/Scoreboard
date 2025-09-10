import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { MatchState } from '@pkg/types';
import { applyTheme, type ThemeName } from './themes';
import './theme.css';
import { Scoreboard } from './components/Scoreboard';
import { connectDisplay } from './realtime';
import { applyTick } from '@pkg/logic';

function App(){
  const p = new URLSearchParams(location.search);
  const org = p.get('org') || 'orgA';
  const match = p.get('match') || 'demo';
  const token = p.get('token') || 'public';
  const [homeName, setHome] = useState(p.get('home') || 'HOME');
  const [awayName, setAway] = useState(p.get('away') || 'AWAY');
  const [homeLogo] = useState<string | null>(p.get('homeLogo'));
  const [awayLogo] = useState<string | null>(p.get('awayLogo'));
  const [theme, setTheme] = useState<ThemeName>((p.get('theme') as ThemeName) || 'neon');
  const [ui] = useState(p.get('ui') === '1');
  const [state, setState] = useState<MatchState|null>(null);

  useEffect(()=>{ applyTheme(theme); }, [theme]);
  useEffect(()=>{
    const conn = connectDisplay(org, match, token, (s:MatchState, info:any)=>{
      setState(s);
      if (info){ setHome(info.home_name || homeName); setAway(info.away_name || awayName); }
    });
    const id = setInterval(()=>{ setState((prev)=> prev ? applyTick(prev) : prev); }, 100);
    return ()=>{ conn.close(); clearInterval(id); };
  }, [org,match,token]);

  function toggleFullscreen(){
    const el:any = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
  }

  return (<div className="board">
    {state && <Scoreboard state={state} homeName={homeName} awayName={awayName} homeLogo={homeLogo||undefined} awayLogo={awayLogo||undefined}/>}
    <div className={ui ? 'toolbar' : 'toolbar hidden'}>
      <select value={theme} onChange={e=>setTheme(e.target.value as ThemeName)}>
        <option value="neon">Neon</option><option value="glass">Glass</option><option value="classic">Classic</option>
      </select>
      <button onClick={()=>toggleFullscreen()}>Plein écran (F)</button>
    </div>
  </div>);
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
