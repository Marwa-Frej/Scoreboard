import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { MatchState } from '@pkg/types';
import { applyTheme, type ThemeName } from './themes';
import './theme.css';
import { Scoreboard } from './components/Scoreboard';
import { connectDisplay, createSupa } from './realtime';
import { applyTick } from '@pkg/logic';

function App(){
  const p = new URLSearchParams(location.search);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [homeName, setHome] = useState('HOME');
  const [awayName, setAway] = useState('AWAY');
  const [homeLogo] = useState<string | null>(p.get('homeLogo'));
  const [awayLogo] = useState<string | null>(p.get('awayLogo'));
  const [theme, setTheme] = useState<ThemeName>((p.get('theme') as ThemeName) || 'neon');
  const [ui] = useState(p.get('ui') === '1');
  const [state, setState] = useState<MatchState|null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('En attente de sélection de match...');
  const [displayConnection, setDisplayConnection] = useState<any>(null);

  useEffect(()=>{ applyTheme(theme); }, [theme]);
  
  // Écouter les matchs actifs depuis la base de données
  useEffect(()=>{
    const supa = createSupa();
    setConnectionStatus('Recherche de match actif...');
    
    // Écouter les changements de statut des matchs
    const channel = supa
      .channel('matches-status')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' }, 
        (payload) => {
          console.log('Display - Changement de match détecté:', payload);
          checkForActiveMatch();
        }
      )
      .subscribe();

    // Vérifier s'il y a un match actif au démarrage
    checkForActiveMatch();

    async function checkForActiveMatch() {
      try {
        console.log('Display - Recherche de match actif...');
        
        const { data: matches } = await supa
          .from('matches')
          .select('*')
          .eq('status', 'live')
          .order('updated_at', { ascending: false })
          .limit(1);

        console.log('Display - Matchs live trouvés:', matches);

        if (matches && matches.length > 0) {
          const match = matches[0];
          console.log('Display - Match actif trouvé:', match);
          setCurrentMatch(match);
          setHome(match.home_name);
          setAway(match.away_name);
          connectToMatch(match);
        } else {
          console.log('Display - Aucun match live, recherche du dernier match...');
          
          // Pas de match live, chercher le dernier match récent
          const { data: recentMatches } = await supa
            .from('matches')
            .select('*')
            .in('status', ['scheduled', 'live', 'finished'])
            .order('updated_at', { ascending: false })
            .limit(1);

          console.log('Display - Matchs récents trouvés:', recentMatches);

          if (recentMatches && recentMatches.length > 0) {
            const match = recentMatches[0];
            console.log('Display - Match récent trouvé:', match);
            setCurrentMatch(match);
            setHome(match.home_name);
            setAway(match.away_name);
            connectToMatch(match);
          } else {
            console.log('Display - Aucun match trouvé');
            setConnectionStatus('Aucun match disponible');
            setState(null);
            setCurrentMatch(null);
          }
        }
      } catch (error) {
        console.error('Display - Erreur lors de la recherche de match:', error);
        setConnectionStatus('Erreur de connexion à la base de données');
      }
    }

    function connectToMatch(match: any) {
      // Fermer la connexion précédente si elle existe
      if (displayConnection) {
        displayConnection.close();
      }

      setConnectionStatus(`Connexion au match: ${match.name}...`);
      
      const conn = connectDisplay(
        'org', // Utiliser 'org' par défaut pour la compatibilité
        match.id, 
        match.display_token, 
        (s: MatchState, info: any) => {
          console.log('Display - État reçu:', s, info);
          setConnectionStatus(`Connecté - ${match.name}`);
          setState(s);
          if (info) { 
            setHome(info.home_name || match.home_name); 
            setAway(info.away_name || match.away_name); 
          }
        }
      );
      
      setDisplayConnection(conn);
    }

    return () => {
      supa.removeChannel(channel);
      if (displayConnection) {
        displayConnection.close();
      }
    };
  }, [displayConnection]);

  // Gestion du tick pour les horloges
  useEffect(() => { 
    if (!state?.matchId) return; 
    const id = setInterval(() => setState(prev => prev ? applyTick(prev) : prev), 100); 
    return () => clearInterval(id); 
  }, [state?.matchId]);

  // Écouter les paramètres URL pour les cas spécifiques
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const org = p.get('org');
    const match = p.get('match');
    const token = p.get('token');
    
    if (org && match && token) {
      console.log('Display - Connexion directe via URL:', { org, match, token });
      setConnectionStatus('Connexion directe...');
      
      if (displayConnection) {
        displayConnection.close();
      }
      
      const conn = connectDisplay(org, match, token, (s: MatchState, info: any) => {
        console.log('Display - État reçu (URL directe):', s, info);
        setConnectionStatus('Connecté - Lien direct');
        setState(s);
        if (info) { 
          setHome(info.home_name || p.get('home') || 'HOME'); 
          setAway(info.away_name || p.get('away') || 'AWAY'); 
        }
      });
      
      setDisplayConnection(conn);
    }
  }, [location.search]);

  function toggleFullscreen(){
    const el: any = document.documentElement;
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
        padding: '30px', 
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '15px' }}>⚽ Scoreboard Pro</div>
        <div style={{ color: '#9aa0a6', marginBottom: '10px' }}>Statut: {connectionStatus}</div>
        {currentMatch && (
          <div style={{ fontSize: '14px', color: '#4ade80', marginTop: '10px' }}>
            Match détecté: {currentMatch.name}
            <br />
            {currentMatch.home_name} vs {currentMatch.away_name}
          </div>
        )}
        <div style={{ fontSize: '12px', marginTop: '15px', color: '#666' }}>
          Le tableau de bord s'affichera automatiquement<br />
          quand un match sera sélectionné dans l'Operator
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
