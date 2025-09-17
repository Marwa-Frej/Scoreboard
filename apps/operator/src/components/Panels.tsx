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
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('fb:goal',{team:'home'})}>⚽ +1 Équipe A</button>
          <button className="danger" onClick={()=>send('fb:goal:dec',{team:'home'})}>❌ -1 Équipe A</button>
          <button className="success" onClick={()=>send('fb:goal',{team:'away'})}>⚽ +1 Équipe B</button>
          <button className="danger" onClick={()=>send('fb:goal:dec',{team:'away'})}>❌ -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Cartons Équipe A">
        <ControlGrid cols="two-col">
          <button style={{background:'#fbbf24'}} onClick={()=>send('fb:card',{team:'home',color:'yellow'})}>🟨 +1 Jaune</button>
          <button style={{background:'#d97706'}} onClick={()=>send('fb:card:dec',{team:'home',color:'yellow'})}>🟨 -1 Jaune</button>
          <button className="danger" onClick={()=>send('fb:card',{team:'home',color:'red'})}>🟥 +1 Rouge</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('fb:card:dec',{team:'home',color:'red'})}>🟥 -1 Rouge</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Cartons Équipe B">
        <ControlGrid cols="two-col">
          <button style={{background:'#fbbf24'}} onClick={()=>send('fb:card',{team:'away',color:'yellow'})}>🟨 +1 Jaune</button>
          <button style={{background:'#d97706'}} onClick={()=>send('fb:card:dec',{team:'away',color:'yellow'})}>🟨 -1 Jaune</button>
          <button className="danger" onClick={()=>send('fb:card',{team:'away',color:'red'})}>🟥 +1 Rouge</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('fb:card:dec',{team:'away',color:'red'})}>🟥 -1 Rouge</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Temps additionnel">
        <ControlGrid cols="two-col">
          <button onClick={()=>send('fb:stoppage',{minutes:1})}>+1 min</button>
          <button onClick={()=>send('fb:stoppage:dec')}>-1 min</button>
          <button onClick={()=>send('fb:stoppage',{minutes:2})}>+2 min</button>
          <button onClick={()=>send('fb:stoppage',{minutes:3})}>+3 min</button>
          <button onClick={()=>send('fb:stoppage',{minutes:0})}>Reset</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Tirs au but">
        <button onClick={()=>send('fb:so:start')}>Démarrer TAB</button>
        <ControlGrid cols="four-col">
          <button className="success" onClick={()=>send('fb:so:record',{team:'home',res:'G'})}>A ✅</button>
          <button className="danger" onClick={()=>send('fb:so:record',{team:'home',res:'M'})}>A ❌</button>
          <button style={{background:'#6b7280'}} onClick={()=>send('fb:so:undo',{team:'home'})}>A ↶</button>
          <div></div>
          <button className="success" onClick={()=>send('fb:so:record',{team:'away',res:'G'})}>B ✅</button>
          <button className="danger" onClick={()=>send('fb:so:record',{team:'away',res:'M'})}>B ❌</button>
          <button style={{background:'#6b7280'}} onClick={()=>send('fb:so:undo',{team:'away'})}>B ↶</button>
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function HandballPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Buts">
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('hb:goal',{team:'home'})}>🥅 +1 Équipe A</button>
          <button className="danger" onClick={()=>send('hb:goal:dec',{team:'home'})}>❌ -1 Équipe A</button>
          <button className="success" onClick={()=>send('hb:goal',{team:'away'})}>🥅 +1 Équipe B</button>
          <button className="danger" onClick={()=>send('hb:goal:dec',{team:'away'})}>❌ -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Temps morts">
        <ControlGrid cols="two-col">
          <button onClick={()=>send('hb:timeout',{team:'home'})}>⏱ +1 TO Équipe A</button>
          <button onClick={()=>send('hb:timeout:dec',{team:'home'})}>⏱ -1 TO Équipe A</button>
          <button onClick={()=>send('hb:timeout',{team:'away'})}>⏱ +1 TO Équipe B</button>
          <button onClick={()=>send('hb:timeout:dec',{team:'away'})}>⏱ -1 TO Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Exclusions 2 minutes">
        <ControlGrid cols="two-col">
          <button className="danger" onClick={()=>send('hb:susp',{team:'home',minutes:2})}>2' +1 Équipe A</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hb:susp:remove',{team:'home'})}>2' -1 Équipe A</button>
          <button className="danger" onClick={()=>send('hb:susp',{team:'away',minutes:2})}>2' +1 Équipe B</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hb:susp:remove',{team:'away'})}>2' -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function BasketPanel({state, send}:{state:MatchState, send:(a:string,p?:any)=>void}){
  const meta:any = (state as any).meta || {};
  return (
    <div className="match-controls">
      <ControlSection title="Points">
        <ControlGrid cols="three-col">
          <button className="success" onClick={()=>send('bb:score',{team:'home',points:1})}>+1 Équipe A</button>
          <button className="success" onClick={()=>send('bb:score',{team:'home',points:2})}>+2 Équipe A</button>
          <button className="success" onClick={()=>send('bb:score',{team:'home',points:3})}>+3 Équipe A</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'home',points:1})}>-1 Équipe A</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'home',points:2})}>-2 Équipe A</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'home',points:3})}>-3 Équipe A</button>
          <button className="success" onClick={()=>send('bb:score',{team:'away',points:1})}>+1 Équipe B</button>
          <button className="success" onClick={()=>send('bb:score',{team:'away',points:2})}>+2 Équipe B</button>
          <button className="success" onClick={()=>send('bb:score',{team:'away',points:3})}>+3 Équipe B</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'away',points:1})}>-1 Équipe B</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'away',points:2})}>-2 Équipe B</button>
          <button className="danger" onClick={()=>send('bb:score:dec',{team:'away',points:3})}>-3 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Temps morts">
        <ControlGrid cols="two-col">
          <button onClick={()=>send('bb:to',{team:'home'})}>⏱ Utiliser TO A</button>
          <button onClick={()=>send('bb:to:restore',{team:'home'})}>⏱ Restaurer TO A</button>
          <button onClick={()=>send('bb:to',{team:'away'})}>⏱ Utiliser TO B</button>
          <button onClick={()=>send('bb:to:restore',{team:'away'})}>⏱ Restaurer TO B</button>
          <button onClick={()=>send('bb:tf:reset')}>Reset Fautes équipe</button>
        </ControlGrid>
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
            <div key={i} style={{display:'flex', flexDirection:'column', gap:'4px'}}>
              <button onClick={()=>send('bb:foul',{team:'home', index:i})} 
                      style={{background: p.fouls >= 5 ? '#dc2626' : p.fouls >= 3 ? '#f59e0b' : '#16a34a'}}>
                #{p.num} +1 ({p.fouls})
              </button>
              <button onClick={()=>send('bb:foul:dec',{team:'home', index:i})} 
                      style={{background: '#991b1b', fontSize:'12px', padding:'4px'}}>
                -1
              </button>
            </div>
          ))}
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Fautes joueurs Équipe B">
        <ControlGrid cols="three-col">
          {meta.roster?.away?.map((p:any,i:number)=>(
            <div key={i} style={{display:'flex', flexDirection:'column', gap:'4px'}}>
              <button onClick={()=>send('bb:foul',{team:'away', index:i})}
                      style={{background: p.fouls >= 5 ? '#dc2626' : p.fouls >= 3 ? '#f59e0b' : '#16a34a'}}>
                #{p.num} +1 ({p.fouls})
              </button>
              <button onClick={()=>send('bb:foul:dec',{team:'away', index:i})} 
                      style={{background: '#991b1b', fontSize:'12px', padding:'4px'}}>
                -1
              </button>
            </div>
          ))}
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function HockeyIcePanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Buts">
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('hi:goal',{team:'home'})}>🏒 +1 Équipe A</button>
          <button className="danger" onClick={()=>send('hi:goal:dec',{team:'home'})}>❌ -1 Équipe A</button>
          <button className="success" onClick={()=>send('hi:goal',{team:'away'})}>🏒 +1 Équipe B</button>
          <button className="danger" onClick={()=>send('hi:goal:dec',{team:'away'})}>❌ -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Pénalités Équipe A">
        <ControlGrid cols="three-col">
          <button className="danger" onClick={()=>send('hi:penalty',{team:'home',minutes:2})}>+1 Pén 2min</button>
          <button className="danger" onClick={()=>send('hi:penalty',{team:'home',minutes:5})}>+1 Pén 5min</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hi:penalty:remove',{team:'home'})}>-1 Pénalité</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Pénalités Équipe B">
        <ControlGrid cols="three-col">
          <button className="danger" onClick={()=>send('hi:penalty',{team:'away',minutes:2})}>+1 Pén 2min</button>
          <button className="danger" onClick={()=>send('hi:penalty',{team:'away',minutes:5})}>+1 Pén 5min</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hi:penalty:remove',{team:'away'})}>-1 Pénalité</button>
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function HockeyFieldPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Buts">
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('hf:goal',{team:'home'})}>🏑 +1 Équipe A</button>
          <button className="danger" onClick={()=>send('hf:goal:dec',{team:'home'})}>❌ -1 Équipe A</button>
          <button className="success" onClick={()=>send('hf:goal',{team:'away'})}>🏑 +1 Équipe B</button>
          <button className="danger" onClick={()=>send('hf:goal:dec',{team:'away'})}>❌ -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Cartes Équipe A">
        <ControlGrid cols="two-col">
          <button style={{background:'#16a34a'}} onClick={()=>send('hf:card',{team:'home',color:'green'})}>🟩 +1 Verte</button>
          <button style={{background:'#15803d'}} onClick={()=>send('hf:card:dec',{team:'home',color:'green'})}>🟩 -1 Verte</button>
          <button style={{background:'#fbbf24'}} onClick={()=>send('hf:card',{team:'home',color:'yellow'})}>🟨 +1 Jaune</button>
          <button style={{background:'#d97706'}} onClick={()=>send('hf:card:dec',{team:'home',color:'yellow'})}>🟨 -1 Jaune</button>
          <button className="danger" onClick={()=>send('hf:card',{team:'home',color:'red'})}>🟥 +1 Rouge</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hf:card:dec',{team:'home',color:'red'})}>🟥 -1 Rouge</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Cartes Équipe B">
        <ControlGrid cols="two-col">
          <button style={{background:'#16a34a'}} onClick={()=>send('hf:card',{team:'away',color:'green'})}>🟩 +1 Verte</button>
          <button style={{background:'#15803d'}} onClick={()=>send('hf:card:dec',{team:'away',color:'green'})}>🟩 -1 Verte</button>
          <button style={{background:'#fbbf24'}} onClick={()=>send('hf:card',{team:'away',color:'yellow'})}>🟨 +1 Jaune</button>
          <button style={{background:'#d97706'}} onClick={()=>send('hf:card:dec',{team:'away',color:'yellow'})}>🟨 -1 Jaune</button>
          <button className="danger" onClick={()=>send('hf:card',{team:'away',color:'red'})}>🟥 +1 Rouge</button>
          <button style={{background:'#991b1b'}} onClick={()=>send('hf:card:dec',{team:'away',color:'red'})}>🟥 -1 Rouge</button>
        </ControlGrid>
      </ControlSection>
    </div>
  );
}

function VolleyballPanel({send}:{send:(a:string,p?:any)=>void}){
  return (
    <div className="match-controls">
      <ControlSection title="Points">
        <ControlGrid cols="two-col">
          <button className="success" onClick={()=>send('vb:point',{team:'home'})}>🏐 +1 Équipe A</button>
          <button className="danger" onClick={()=>send('vb:point:dec',{team:'home'})}>❌ -1 Équipe A</button>
          <button className="success" onClick={()=>send('vb:point',{team:'away'})}>🏐 +1 Équipe B</button>
          <button className="danger" onClick={()=>send('vb:point:dec',{team:'away'})}>❌ -1 Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Service">
        <ControlGrid cols="two-col">
          <button onClick={()=>send('vb:serve',{team:'home'})}>🏐 Service A</button>
          <button onClick={()=>send('vb:serve',{team:'away'})}>🏐 Service B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Temps morts">
        <ControlGrid cols="two-col">
          <button onClick={()=>send('vb:timeout',{team:'home'})}>⏱ +1 TO Équipe A</button>
          <button onClick={()=>send('vb:timeout:dec',{team:'home'})}>⏱ -1 TO Équipe A</button>
          <button onClick={()=>send('vb:timeout',{team:'away'})}>⏱ +1 TO Équipe B</button>
          <button onClick={()=>send('vb:timeout:dec',{team:'away'})}>⏱ -1 TO Équipe B</button>
        </ControlGrid>
      </ControlSection>
      
      <ControlSection title="Gestion des sets">
        <button onClick={()=>send('vb:nextSet')}>Valider le set</button>
      </ControlSection>
    </div>
  );
}
