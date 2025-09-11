import React, { useEffect, useState } from 'react';
import type { MatchInfo, MatchState } from '@pkg/types';
import { initMatchState, reduce } from '../state';
import { Panel } from './Panels';
import { createOperatorChannel } from '../realtime';
import { applyTick } from '@pkg/logic';
import { supa } from '../supabase';

interface MatchPageProps {
  match: MatchInfo;
  onBack: () => void;
}

export function MatchPage({ match, onBack }: MatchPageProps) {
  const [state, setState] = useState<MatchState | null>(null);
  const [chan, setChan] = useState<any>(null);
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Connexion...');

  // Marquer le match comme "live" quand il est sélectionné
  useEffect(() => {
    const markAsLive = async () => {
      try {
        const { data, error } = await supa
          .from('matches')
          .update({ 
            status: 'live',
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id)
          .select('*');
        
        if (error) {
          console.error('Erreur lors du marquage live:', error);
        } else {
          console.log('Match marqué comme live:', data);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      }
    };
    markAsLive();
  }, [match.id]);

  useEffect(() => {
    const key = `${match.org_id}:${match.id}`;
    const newState = initMatchState(key, match.sport);
    setState(newState);
    
    if (chan) chan.close();
    
    const c = createOperatorChannel(
      match.org_slug || 'org', 
      match.id, 
      match.display_token, 
      () => {
        console.log('Display demande l\'état du match');
        setConnectionStatus('Display connecté');
        if (newState) c.publish(newState, match); 
      }, 
      () => {
        console.log('Canal opérateur connecté');
        setConnectionStatus('Canal prêt');
        if (newState) c.publish(newState, match); 
      }
    );
    setChan(c);
    
    const u = new URL('http://localhost:5174/'); 
    u.searchParams.set('org', match.org_slug || 'org'); 
    u.searchParams.set('match', match.id); 
    u.searchParams.set('token', match.display_token); 
    u.searchParams.set('home', match.home_name);
    u.searchParams.set('away', match.away_name);
    u.searchParams.set('ui', '1'); 
    setDisplayUrl(u.toString());

    return () => {
      // Marquer le match comme "scheduled" quand on quitte la page
      const markAsScheduled = async () => {
        await supa.from('matches').update({ status: 'scheduled' }).eq('id', match.id);
        console.log('Match marqué comme scheduled:', match.id);
      };
      markAsScheduled();
      
      if (c) c.close();
    };
  }, [match]);

  useEffect(() => { 
    if (!state?.matchId) return; 
    const id = setInterval(() => setState(prev => prev ? applyTick(prev) : prev), 100); 
    return () => clearInterval(id); 
  }, [state?.matchId]);

  function send(type: string, payload?: any) {
    if (!state || !chan) return;
    const next = reduce(state, { type, payload });
    setState(next);
    console.log('Envoi état vers Display:', { type, payload, state: next });
    chan.publish(next, match);
  }

  if (!state) {
    return (
      <div className="match-page">
        <div className="card">
          <div className="loading">Chargement du match...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-page">
      <div className="match-header">
        <button onClick={onBack} className="back-button">
          ← Retour à l'espace
        </button>
        <div className="match-title-section">
          <h1 className="match-title">{match.name}</h1>
          <div className="match-subtitle">
            {match.home_name} vs {match.away_name} • {state.sport}
          </div>
        </div>
        <div className="sport-selector">
          <select 
            value={state.sport} 
            onChange={e => send('sport:set', { sport: e.target.value })}
          >
            {['basic','football','handball','basket','hockey_ice','hockey_field','volleyball'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="match-content">
        <div className="main-score">
          <div className="team-score">
            <div className="team-name">{match.home_name}</div>
            <div className="score-display">{state.score.home.toString().padStart(2,'0')}</div>
          </div>
          <div className="score-vs">:</div>
          <div className="team-score">
            <div className="team-name">{match.away_name}</div>
            <div className="score-display">{state.score.away.toString().padStart(2,'0')}</div>
          </div>
        </div>
        
        {state.sport !== 'volleyball' && (
          <div className="time-controls">
            <button className="primary" onClick={() => send('clock:start')}>▶</button>
            <button className="danger" onClick={() => send('clock:stop')}>⏸</button>
            <div className="time-display">
              {Math.floor(state.clock.remainingMs/60000).toString().padStart(2,'0')}:
              {Math.floor((state.clock.remainingMs%60000)/1000).toString().padStart(2,'0')}
            </div>
            <div className="period-display">Période {state.clock.period}</div>
            <button onClick={() => send('clock:reset')}>⟲ Reset</button>
            <button onClick={() => send('period:next')}>Période +1</button>
          </div>
        )}
        
        <div className="controls-section">
          <Panel state={state} send={(a, p) => send(a, p) as any} />
        </div>

        {displayUrl && (
          <div className="display-link">
            <div className="small">
              <div style={{ marginBottom: '8px' }}>
                <strong>Statut :</strong> <span style={{ color: connectionStatus.includes('connecté') || connectionStatus.includes('prêt') ? '#4ade80' : '#fbbf24' }}>{connectionStatus}</span>
              </div>
              <strong>Lien Display :</strong> 
              <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                {displayUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}