import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo } from '@pkg/types';
import { supa } from './supabase';
import { SpacePage } from './components/SpacePage';
import { MatchPage } from './components/MatchPage';

console.log('🚀 Operator - Démarrage de l\'application');

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<{ id: string, slug: string, name: string } | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<'space' | 'match'>('space');
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string>('');

  // Auth simple - une seule fois
  useEffect(() => {
    console.log('🔐 Auth - Initialisation unique');
    
    let isMounted = true;
    
    // Récupérer l'utilisateur actuel
    supa.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) {
        console.log('👤 Auth - Utilisateur:', user?.email || 'Aucun');
        setUser(user);
        setLoading(false);
      }
    });

    // Écouter les changements d'auth
    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        console.log('🔄 Auth - Changement:', session?.user?.email || 'Déconnecté');
        setUser(session?.user || null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Pas de dépendances - une seule fois

  // Charger les données quand l'utilisateur est connecté
  useEffect(() => {
    if (!user?.id) {
      // Reset quand pas d'utilisateur
      setOrg(null);
      setMatches([]);
      setCurrentPage('space');
      setSelectedMatch(null);
      setError('');
      return;
    }

    console.log('📊 Data - Chargement pour utilisateur:', user.email);
    
    let isMounted = true;
    
    async function loadData() {
      try {
        // Charger les organisations
        const { data: orgs, error: orgError } = await supa
          .from('org_members_with_org')
          .select('*')
          .eq('user_id', user.id);

        if (!isMounted) return;

        if (orgError) {
          console.error('❌ Erreur orgs:', orgError);
          setError(`Erreur organisations: ${orgError.message}`);
          return;
        }

        if (!orgs || orgs.length === 0) {
          console.warn('⚠️ Aucune organisation');
          setError('Aucune organisation trouvée');
          return;
        }

        const userOrg = orgs[0];
        const orgData = {
          id: userOrg.org_id,
          slug: userOrg.org_slug,
          name: userOrg.org_name
        };
        
        console.log('🏢 Organisation:', orgData.name);
        setOrg(orgData);

        // Charger les matchs
        const { data: matchesData, error: matchError } = await supa
          .from('matches')
          .select('*')
          .eq('org_id', orgData.id)
          .order('scheduled_at');

        if (!isMounted) return;

        if (matchError) {
          console.error('❌ Erreur matchs:', matchError);
          setError(`Erreur matchs: ${matchError.message}`);
          return;
        }

        console.log('📋 Matchs chargés:', matchesData?.length || 0);
        setMatches(matchesData || []);

      } catch (err) {
        if (!isMounted) return;
        console.error('💥 Erreur inattendue:', err);
        setError(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Seulement quand l'ID utilisateur change

  // Fonctions de navigation simples
  function handleMatchSelect(match: MatchInfo) {
    console.log('🎯 Sélection match:', match.name);
    setSelectedMatch(match);
    setCurrentPage('match');
  }

  function handleBackToSpace() {
    console.log('🔙 Retour espace');
    setCurrentPage('space');
    setSelectedMatch(null);
  }

  function handleMatchesUpdate(updatedMatches: MatchInfo[]) {
    console.log('🔄 Mise à jour matchs:', updatedMatches.length);
    setMatches(updatedMatches);
  }

  // Affichage conditionnel simple
  if (loading) {
    return (
      <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
        <div className="card" style={{width:360, textAlign:'center'}}>
          <div>⏳ Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
        <div className="card" style={{width:400, textAlign:'center'}}>
          <h2 style={{color:'#ff6b6b'}}>⚠️ Erreur</h2>
          <div style={{color:'#ff6b6b', marginBottom:'16px'}}>{error}</div>
          <button onClick={() => window.location.reload()} className="primary">
            🔄 Recharger
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (currentPage === 'match' && selectedMatch) {
    return (
      <MatchPage 
        match={selectedMatch} 
        onBack={handleBackToSpace}
      />
    );
  }

  return (
    <SpacePage 
      user={user}
      org={org}
      orgs={org ? [org] : []}
      matches={matches}
      onMatchSelect={handleMatchSelect}
      onMatchesUpdate={handleMatchesUpdate}
    />
  );
}

function Login() {
  const [email, setEmail] = useState('operator@example.com');
  const [password, setPassword] = useState('demo-demo');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  async function submit() {
    setSubmitting(true);
    setMsg('');
    
    try {
      if (mode === 'signin') {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) {
          setMsg(`Erreur: ${error.message}`);
        }
      } else {
        const { error } = await supa.auth.signUp({ email, password });
        setMsg(error ? `Erreur: ${error.message}` : 'Vérifiez vos emails');
      }
    } catch (err) {
      setMsg(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    
    setSubmitting(false);
  }
  
  return (
    <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
      <div className="card" style={{width:360}}>
        <h2 className="h1">🎮 Connexion Opérateur</h2>
        <div className="col">
          <input 
            className="input" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            placeholder="Email"
            type="email"
            disabled={submitting}
          />
          <input 
            className="input" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            placeholder="Mot de passe"
            disabled={submitting}
          />
          <div className="row">
            <button 
              onClick={submit} 
              className="primary" 
              disabled={submitting}
              style={{flex: 1}}
            >
              {submitting ? 'Connexion...' : (mode==='signin'?'Se connecter':'Créer un compte')}
            </button>
          </div>
          <div className="row">
            <button 
              onClick={()=>setMode(mode==='signin'?'signup':'signin')}
              disabled={submitting}
              style={{width: '100%'}}
            >
              {mode==='signin'?'Créer un compte':'J\'ai déjà un compte'}
            </button>
          </div>
          {msg && <div className="small" style={{
            color: msg.includes('Erreur') ? '#ff6b6b' : '#4ade80',
            textAlign: 'center',
            marginTop: '8px'
          }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}

console.log('🎯 Main - Initialisation du root React');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Main - Élément root non trouvé !');
} else {
  console.log('✅ Main - Élément root trouvé, création de l\'app');
  const root = createRoot(rootElement);
  root.render(<App />); // Suppression de React.StrictMode qui peut causer des doubles rendus
  console.log('🚀 Main - Application React montée');
}