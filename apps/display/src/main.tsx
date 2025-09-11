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
  const [connectionStatus, setConnectionStatus] = useState<string>('Connexion...');

  useEffect(()=>{ applyTheme(theme); }, [theme]);
  useEffect(()=>{
    console.log('Display - Connexion au canal:', { org, match, token });
    setConnectionStatus('Connexion au canal...');
    
    const conn = connectDisplay(org, match, token, (s:MatchState, info:any)=>{
      console.log('Display - État reçu:', s, info);
      setConnectionStatus('Connecté - Données reçues');
      setState(s);
      if (info){ setHome(info.home_name || homeName); setAway(info.away_name || awayName); }
    });
    
    // Timeout pour détecter les problèmes de connexion
    const timeout = setTimeout(() => {
      if (!state) {
        setConnectionStatus('Pas de données reçues');
        console.warn('Display - Aucune donnée reçue après 5 secondes');
      }
    }, 5000);
    
    const id = setInterval(()=>{ setState((prev)=> prev ? applyTick(prev) : prev); }, 100);
    return ()=>{ conn.close(); clearInterval(id); clearTimeout(timeout); };
  }, [org,match,token]);

  function toggleFullscreen(){
    const el:any = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
  }

  return (<div className="board">
    {state && <Scoreboard state={state} homeName={homeName} awayName={awayName} homeLogo={homeLogo||undefined} awayLogo={awayLogo||undefined}/>}
    {!state && (
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚽ Scoreboard Pro</div>
        <div style={{ color: '#9aa0a6' }}>Statut: {connectionStatus}</div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          Canal: {org}:{match}:{token}
        </div>
      </div>
    )}
    <div className={ui ? 'toolbar' : 'toolbar hidden'}>
      <select value={theme} onChange={e=>setTheme(e.target.value as ThemeName)}>
        <option value="neon">Neon</option><option value="glass">Glass</option><option value="classic">Classic</option>
      </select>
      <button onClick={()=>toggleFullscreen()}>Plein écran (F)</button>
    </div>
  </div>);
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
