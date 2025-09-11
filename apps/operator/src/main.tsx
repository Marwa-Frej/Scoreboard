import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo } from '@pkg/types';
import { supa } from './supabase';
import { SpacePage } from './pages/SpacePage';
import { MatchPage } from './pages/MatchPage';

console.log('🚀 Operator - Démarrage de l\'application');

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<{ id: string, slug: string, name: string } | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<'space' | 'match'>('space');
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  // Auth - une seule initialisation
  useEffect(() => {
    if (initialized) return;
    
    console.log('🔐 Auth - Initialisation');
    setInitialized(true);
    
    async function initAuth() {
      try {
        const { data: { user } } = await supa.auth.getUser();
        console.log('👤 Auth - Utilisateur:', user?.email || 'Aucun');
        setUser(user);
        
        if (user) {
          await loadUserData(user);
        }
      } catch (err) {
        console.error('❌ Auth - Erreur:', err);
        setError('Erreur d\'authentification');
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Écouter les changements d'auth une seule fois
    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth - Changement:', event, session?.user?.email || 'Déconnecté');
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrg(null);
        setMatches([]);
        setCurrentPage('space');
        setSelectedMatch(null);
        setError('');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadUserData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  // Fonction stable pour charger les données utilisateur
  async function loadUserData(user: any) {
    try {
      console.log('📊 Data - Chargement pour utilisateur:', user.email);
      setError('');
      
      // Charger les organisations
      const { data: orgs, error: orgError } = await supa
        .from('org_members_with_org')
        .select('*')
        .eq('user_id', user.id);

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

      if (matchError) {
        console.error('❌ Erreur matchs:', matchError);
        setError(`Erreur matchs: ${matchError.message}`);
        return;
      }

      console.log('📋 Matchs chargés:', matchesData?.length || 0);
      setMatches(matchesData || []);

    } catch (err) {
      console.error('💥 Erreur inattendue:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
  }

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
      matches={matches}
      onMatchSelect={handleMatchSelect}
      onMatchesUpdate={handleMatchesUpdate}
    />
  );
}

function Login() {
  const [email, setEmail] = useState('gilles.guerrin49@gmail.com');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  async function submit() {
    if (!email.trim() || !password.trim()) {
      setMsg('Veuillez remplir tous les champs');
      return;
    }
    
    setSubmitting(true);
    setMsg('');
    
    try {
      if (mode === 'signin') {
        console.log('🔐 Tentative de connexion pour:', email);
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('❌ Erreur de connexion:', error);
          setMsg(`Erreur: ${error.message}`);
        } else {
          console.log('✅ Connexion réussie');
        }
      } else {
        console.log('📝 Tentative d\'inscription pour:', email);
        const { error } = await supa.auth.signUp({ email, password });
        if (error) {
          console.error('❌ Erreur d\'inscription:', error);
          setMsg(`Erreur: ${error.message}`);
        } else {
          console.log('✅ Inscription réussie');
          setMsg('Compte créé ! Vous pouvez maintenant vous connecter.');
          setMode('signin');
        }
      }
    } catch (err) {
      console.error('💥 Erreur inattendue:', err);
      setMsg(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    
    setSubmitting(false);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !submitting) {
      submit();
    }
  }
  
  return (
    <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
      <div className="card" style={{width:360}}>
        <h2 className="h1">🎮 Connexion Opérateur</h2>
        <div className="small" style={{marginBottom:'16px', color:'#9aa0a6', textAlign:'center'}}>
          Utilisez votre compte Supabase ou créez-en un nouveau
        </div>
        <div className="col">
          <input 
            className="input" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="Email"
            type="email"
            disabled={submitting}
            autoComplete="email"
          />
          <input 
            className="input" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="Mot de passe"
            disabled={submitting}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          <div className="row">
            <button 
              onClick={submit} 
              className="primary" 
              disabled={submitting || !email.trim() || !password.trim()}
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
          
          {/* Aide pour les utilisateurs */}
          <div className="small" style={{marginTop:'16px', color:'#6b7280', textAlign:'center'}}>
            {mode === 'signin' ? (
              <>
                💡 <strong>Compte de test :</strong><br/>
                Email: gilles.guerrin49@gmail.com<br/>
                (Créez votre mot de passe si première connexion)
              </>
            ) : (
              <>
                📝 <strong>Nouveau compte :</strong><br/>
                Entrez votre email et choisissez un mot de passe
              </>
            )}
          </div>
          
          {msg && <div className="small" style={{
            color: msg.includes('Erreur') ? '#ff6b6b' : '#4ade80',
            textAlign: 'center',
            marginTop: '12px',
            padding: '8px',
            background: msg.includes('Erreur') ? 'rgba(255, 107, 107, 0.1)' : 'rgba(74, 222, 128, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${msg.includes('Erreur') ? 'rgba(255, 107, 107, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`
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
  root.render(<App />);
  console.log('🚀 Main - Application React montée');
}