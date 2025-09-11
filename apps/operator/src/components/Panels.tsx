import React from 'react';
import type { MatchState } from '@pkg/types';

const ControlSection = ({title, children}:{title:string, children:any}) => (
  <div className="control-section">
    <h3>{title}</h3>
    <div className="control-grid">{children}</div>
  </div>
);

const ControlGrid = ({cols, children}:{cols?:string, children:any}) => (
  <div className={`control-grid ${cols || ''}`}>{children}</div>
);

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
  return (
    <div className="match-controls">
      <ControlSection title="Contrôle du temps">
        <button className="primary" onClick={()=>send('clock:start')}>▶ Démarrer</button>
        <button className="danger" onClick={()=>send('clock:stop')}>⏸ Arrêter</button>
        <button onClick={()=>send('clock:reset')}>⟲ Reset</button>
        <button onClick={()=>send('period:next')}>Période +1</button>
        <button onClick={()=>send('period:prev')}>Période -1</button>
      </ControlSection>
      
      <ControlSection title="Score Équipe A">
        <button className="success" onClick={()=>send('score:inc',{team:'home'})}>+1</button>
        <button className="danger" onClick={()=>send('score:dec',{team:'home'})}>-1</button>
      </ControlSection>
      
      <ControlSection title="Score Équipe B">
        <button className="success" onClick={()=>send('score:inc',{team:'away'})}>+1</button>
        <button className="danger" onClick={()=>send('score:dec',{team:'away'})}>-1</button>
      </ControlSection>
    </div>
  );
}

function FootballPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Buts">
        <button className="success" onClick={()=>send('fb:goal',{team:'home'})}>⚽ But Équipe A</button>
        <button className="success" onClick={()=>send('fb:goal',{team:'away'})}>⚽ But Équipe B</button>
      </ControlSection>
      
      <ControlSection title="Cartons Équipe A">
        <button style={{background:'#fbbf24'}} onClick={()=>send('fb:card',{team:'home',color:'yellow'})}>🟨 Jaune</button>
        <button className="danger" onClick={()=>send('fb:card',{team:'home',color:'red'})}>🟥 Rouge</button>
      </ControlSection>
      
      <ControlSection title="Cartons Équipe B">
        <button style={{background:'#fbbf24'}} onClick={()=>send('fb:card',{team:'away',color:'yellow'})}>🟨 Jaune</button>
        <button className="danger" onClick={()=>send('fb:card',{team:'away',color:'red'})}>🟥 Rouge</button>
      </ControlSection>
      
      <ControlSection title="Temps additionnel">
        <button onClick={()=>send('fb:stoppage',{minutes:1})}>+1 min</button>
        <button onClick={()=>send('fb:stoppage',{minutes:2})}>+2 min</button>
        <button onClick={()=>send('fb:stoppage',{minutes:3})}>+3 min</button>
        <button onClick={()=>send('fb:stoppage',{minutes:0})}>Reset</button>
      </ControlSection>
      
      <ControlSection title="Tirs au but">
        <button onClick={()=>send('fb:so:start')}>Démarrer TAB</button>
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('fb:so:record',{team:'home',res:'G'})}>A ✅</button>
          <button className="danger" onClick={()=>send('fb:so:record',{team:'home',res:'M'})}>A ❌</button>
          <button className="success" onClick={()=>send('fb:so:record',{team:'away',res:'G'})}>B ✅</button>
          <button className="danger" onClick={()=>send('fb:so:record',{team:'away',res:'M'})}>B ❌</button>
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function HandballPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Temps morts">
        <button onClick={()=>send('hb:timeout',{team:'home'})}>⏱ TO Équipe A</button>
        <button onClick={()=>send('hb:timeout',{team:'away'})}>⏱ TO Équipe B</button>
      </ControlSection>
      
      <ControlSection title="Exclusions 2 minutes">
        <button className="danger" onClick={()=>send('hb:susp',{team:'home',minutes:2})}>2' Équipe A</button>
        <button className="danger" onClick={()=>send('hb:susp',{team:'away',minutes:2})}>2' Équipe B</button>
      </ControlSection>
    </div>
  );
}

function BasketPanel({state, send}:{state:MatchState, send:(a:string,p?:any)=>void}){
  const meta:any = (state as any).meta || {};
  return (
    <div className="match-controls">
      <ControlSection title="Temps morts">
        <button onClick={()=>send('bb:to',{team:'home'})}>⏱ TO Équipe A</button>
        <button onClick={()=>send('bb:to',{team:'away'})}>⏱ TO Équipe B</button>
        <button onClick={()=>send('bb:tf:reset')}>Reset Fautes équipe</button>
      </ControlSection>
      
      <ControlSection title="Horloge des 24 secondes">
        <button className="primary" onClick={()=>send('bb:shot:start')}>▶ Démarrer</button>
        <button className="danger" onClick={()=>send('bb:shot:stop')}>⏸ Arrêter</button>
        <button onClick={()=>send('bb:shot:reset24')}>⟲ 24s</button>
        <button onClick={()=>send('bb:shot:reset14')}>⟲ 14s</button>
      </ControlSection>
      
      <ControlSection title="Fautes joueurs Équipe A">
        <ControlGrid cols="three-col">
          {meta.roster?.home?.map((p:any,i:number)=>(
            <button key={i} onClick={()=>send('bb:foul',{team:'home', index:i})} 
                    style={{background: p.fouls >= 5 ? '#dc2626' : p.fouls >= 3 ? '#f59e0b' : '#121316'}}>
              #{p.num} ({p.fouls})
            </button>
          ))}
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Fautes joueurs Équipe B">
        <ControlGrid cols="three-col">
          {meta.roster?.away?.map((p:any,i:number)=>(
            <button key={i} onClick={()=>send('bb:foul',{team:'away', index:i})}
                    style={{background: p.fouls >= 5 ? '#dc2626' : p.fouls >= 3 ? '#f59e0b' : '#121316'}}>
              #{p.num} ({p.fouls})
            </button>
          ))}
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function HockeyIcePanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Pénalités Équipe A">
        <button className="danger" onClick={()=>send('hi:penalty',{team:'home',minutes:2})}>2 min</button>
        <button className="danger" onClick={()=>send('hi:penalty',{team:'home',minutes:5})}>5 min</button>
      </ControlSection>
      
      <ControlSection title="Pénalités Équipe B">
        <button className="danger" onClick={()=>send('hi:penalty',{team:'away',minutes:2})}>2 min</button>
        <button className="danger" onClick={()=>send('hi:penalty',{team:'away',minutes:5})}>5 min</button>
      </ControlSection>
    </div>
  );
}

function HockeyFieldPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Cartes Équipe A">
        <button style={{background:'#16a34a'}} onClick={()=>send('hf:card',{team:'home',color:'green'})}>🟩 Verte</button>
        <button style={{background:'#fbbf24'}} onClick={()=>send('hf:card',{team:'home',color:'yellow'})}>🟨 Jaune</button>
        <button className="danger" onClick={()=>send('hf:card',{team:'home',color:'red'})}>🟥 Rouge</button>
      </ControlSection>
      
      <ControlSection title="Cartes Équipe B">
        <button style={{background:'#16a34a'}} onClick={()=>send('hf:card',{team:'away',color:'green'})}>🟩 Verte</button>
        <button style={{background:'#fbbf24'}} onClick={()=>send('hf:card',{team:'away',color:'yellow'})}>🟨 Jaune</button>
        <button className="danger" onClick={()=>send('hf:card',{team:'away',color:'red'})}>🟥 Rouge</button>
      </ControlSection>
    </div>
  );
}

function VolleyballPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
    </div>
  );
}
