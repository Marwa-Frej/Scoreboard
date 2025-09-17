import React, { useEffect, useState } from 'react';
import type { MatchInfo, MatchState } from '@pkg/types';
import { initMatchState, reduce } from '../state';
import { Panel } from '../components/Panels';
import { createOperatorChannel } from '../realtime';
import { applyTick } from '@pkg/logic';
import { supa } from '../supabase';

interface MatchPageProps {
  match: MatchInfo;
  onBack: () => void;
  activeMatch: MatchInfo | null;
  onMatchesUpdate: (matches: MatchInfo[]) => void;
}

export function MatchPage({ match, onBack, activeMatch, onMatchesUpdate }: MatchPageProps) {
  const [state, setState] = useState<MatchState | null>(null);
  const [chan, setChan] = useState<any>(null);
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Connexion...');
  const [archiving, setArchiving] = useState(false);
  const [isUnmounting, setIsUnmounting] = useState(false);
  
  // Un match est "démarré" s'il est actif (statut live)
  const matchStarted = activeMatch?.id === match.id;

  // Marquer le match comme "scheduled" quand il est sélectionné (pas encore actif)
  useEffect(() => {
    if (isUnmounting) return;
    
    const markAsScheduled = async () => {
      try {
        const { data, error } = await supa
          .from('matches')
          .update({ 
            status: 'scheduled',
            updated_at: new Date().toISOString()
          })
          .eq('id', match.id)
          .select('*');
        
        if (error) {
          console.error('Erreur lors du marquage scheduled:', error);
        } else {
          console.log('Match marqué comme scheduled:', data);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      }
    };
    markAsScheduled();
  }, [match.id]);

  useEffect(() => {
    if (isUnmounting) return;
    
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
      setIsUnmounting(true);
      // Fermer le canal quand on quitte
      if (c) c.close();
    };
  }, [match.id, match.org_slug, match.display_token]);

  useEffect(() => { 
    if (!state?.matchId) return; 
    const id = setInterval(() => setState(prev => prev ? applyTick(prev) : prev), 100); 
    return () => clearInterval(id); 
  }, [state?.matchId]);

  function send(type: string, payload?: any) {
    if (!state || !chan) return;
    if (isUnmounting) return;
    
    // Marquer le match comme actif SEULEMENT quand l'horloge démarre
    if (type === 'clock:start') {
      const markAsLive = async () => {
        try {
          const { data, error } = await supa.from('matches').update({ 
            status: 'live',
            updated_at: new Date().toISOString()
          }).eq('id', match.id);
          
          if (error) {
            console.error('Erreur lors du marquage live:', error);
          } else {
            console.log('✅ Match marqué comme ACTIF après démarrage chrono');
            // Mettre à jour la liste des matchs dans le parent
            const updatedMatch = { ...match, status: 'live' as const };
            // Simuler une mise à jour de la liste (le parent devra recharger)
            window.location.reload(); // Solution simple pour rafraîchir l'état global
          }
        } catch (error) {
          console.error('Erreur lors du marquage live:', error);
        }
      };
      markAsLive();
    }
    
    const next = reduce(state, { type, payload });
    setState(next);
    console.log('Envoi état vers Display:', { type, payload, state: next });
    chan.publish(next, match);
  }

  async function resetMatch() {
    if (!confirm('Êtes-vous sûr de vouloir remettre ce match à zéro ? Cela arrêtera le chronomètre et remettra les scores à 0.')) {
      return;
    }
    
    try {
      // Remettre le match en "scheduled" dans la base
      const { error } = await supa
        .from('matches')
        .update({ 
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id);
      
      if (error) {
        console.error('Erreur lors du reset:', error);
        alert(`Erreur lors du reset: ${error.message}`);
        return;
      }
      
      // Réinitialiser l'état local
      const key = `${match.org_id}:${match.id}`;
      const resetState = initMatchState(key, match.sport);
      setState(resetState);
      
      // Publier le nouvel état
      if (chan) {
        chan.publish(resetState, match);
      }
      
      console.log('Match remis à zéro avec succès');
      
      // Rafraîchir pour mettre à jour l'état global
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (err) {
      console.error('Erreur inattendue:', err);
      alert(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }

  async function archiveMatch() {
    if (matchStarted) {
      alert('Impossible d\'archiver un match qui a été démarré. Veuillez d\'abord le remettre à zéro ou attendre qu\'il soit terminé.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir archiver ce match ? Il sera déplacé dans la section des matchs archivés.')) {
      return;
    }
    
    setArchiving(true);
    try {
      const { error } = await supa
        .from('matches')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id);
      
      if (error) {
        console.error('Erreur lors de l\'archivage:', error);
        alert(`Erreur lors de l'archivage: ${error.message}`);
      } else {
        console.log('Match archivé avec succès');
        // Fermer le canal avant de retourner
        if (chan) chan.close();
        onBack();
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      alert(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
    setArchiving(false);
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
          ← Retour à la liste
        </button>
        <div className="match-title-section">
          <h1 className="match-title">{match.name}</h1>
          <div className="match-subtitle">
            {match.home_name} vs {match.away_name}
            {matchStarted && (
              <span style={{
                background: '#dc2626',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                marginLeft: '12px'
              }}>
                🔴 MATCH ACTIF
              </span>
            )}
          </div>
        </div>
        <div className="match-actions">
          <div className="sport-selector">
            <label>Sport:</label>
            <select 
              value={state.sport} 
              onChange={e => send('sport:set', { sport: e.target.value })}
            >
              <option value="basic">Basic</option>
              <option value="football">Football</option>
              <option value="handball">Handball</option>
              <option value="basket">Basketball</option>
              <option value="hockey_ice">Hockey sur glace</option>
              <option value="hockey_field">Hockey sur gazon</option>
              <option value="volleyball">Volleyball</option>
            </select>
          </div>
          <button 
            onClick={archiveMatch}
            disabled={archiving}
            title={matchStarted ? "Impossible d'archiver un match qui a été démarré" : "Archiver ce match"}
            style={{ 
              background: matchStarted ? '#6b7280' : '#f59e0b', 
              borderColor: matchStarted ? '#6b7280' : '#f59e0b',
              color: 'white',
              minHeight: '40px',
              cursor: matchStarted ? 'not-allowed' : 'pointer',
              opacity: matchStarted ? 0.6 : 1
            }}
          >
            {archiving ? '📦 Archivage...' : '📦 Archiver'}
          </button>
          <button 
            onClick={resetMatch}
            disabled={!matchStarted}
            title={matchStarted ? "Remettre le match à zéro" : "Le match n'a pas encore été démarré"}
            style={{ 
              background: matchStarted ? '#dc2626' : '#6b7280', 
              borderColor: matchStarted ? '#dc2626' : '#6b7280',
              color: 'white',
              minHeight: '40px',
              cursor: matchStarted ? 'pointer' : 'not-allowed',
              opacity: matchStarted ? 1 : 0.6
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="match-info">
        <div className="sport-display">
          <strong>Sport actuel:</strong> <span className="sport-badge">{state.sport}</span>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#9aa0a6' }}>
            <strong>Statut:</strong> {matchStarted ? '🔴 Match actif (temps réel)' : '⏸️ Match sélectionné (prêt)'}
          </div>
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
            <button 
              className="primary" 
              onClick={() => send('clock:start')}
              title={matchStarted ? "Reprendre le chronomètre" : "Démarrer le match (devient actif)"}
            >
              ▶ {matchStarted ? 'Reprendre' : 'Démarrer'}
            </button>
            <button className="danger" onClick={() => send('clock:stop')}>⏸</button>
            <div className="time-display">
              {Math.floor(state.clock.remainingMs/60000).toString().padStart(2,'0')}:
              {Math.floor((state.clock.remainingMs%60000)/1000).toString().padStart(2,'0')}
            </div>
            <div className="period-display">Période {state.clock.period}</div>
            <button onClick={() => send('clock:reset')}>⟲ Reset</button>
            <button onClick={() => send('period:next')}>Période +1</button>
            <button onClick={() => send('period:prev')}>Période -1</button>
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
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#9aa0a6' }}>
                {matchStarted ? '🔴 Affichage temps réel actif' : '⏸️ Affichage statique (scores visibles)'}
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