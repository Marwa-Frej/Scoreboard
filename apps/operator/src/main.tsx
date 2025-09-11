import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo } from '@pkg/types';
import { supa } from './supabase';
import { SpacePage } from './components/SpacePage';
import { MatchPage } from './components/MatchPage';

console.log('🚀 Operator - Démarrage de l\'application');

function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('🔐 Auth - Initialisation');
    
    let mounted = true;
    
    supa.auth.getUser().then(r => {
      if (mounted) {
        console.log('👤 Auth - Utilisateur récupéré:', r.data.user?.email || 'Aucun');
        setUser(r.data.user || null);
        setLoading(false);
      }
    }).catch(err => {
      if (mounted) {
        console.error('❌ Auth - Erreur:', err);
        setLoading(false);
      }
    });
    
    const { data: { subscription } } = supa.auth.onAuthStateChange((_e, s) => {
      if (mounted) {
        console.log('🔄 Auth - Changement d\'état:', s?.user?.email || 'Déconnecté');
        setUser(s?.user || null);
        setLoading(false);
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Pas de dépendances - une seule fois
  
  return { user, loading };
}

function Login(){
  const [email, setEmail] = useState('operator@example.com');
  const [password, setPassword] = useState('demo-demo');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  console.log('🔑 Login - Composant affiché');
  
  const submit = useCallback(async () => {
    console.log('📝 Login - Tentative de connexion:', email);
    setSubmitting(true);
    setMsg('');
    try {
      if (mode==='signin'){
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('❌ Login - Erreur signin:', error);
          setMsg(`Erreur de connexion: ${error.message}`);
        } else {
          console.log('✅ Login - Connexion réussie');
        }
      } else {
        const { error } = await supa.auth.signUp({ email, password });
        console.log('📧 Login - Inscription:', error ? 'Erreur' : 'Succès');
        setMsg(error ? `Erreur d'inscription: ${error.message}` : 'Vérifie tes emails pour confirmer.');
      }
    } catch (err) {
      console.error('💥 Login - Erreur inattendue:', err);
      setMsg(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
    setSubmitting(false);
  }, [email, password, mode]);
  
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
          <div className="small" style={{marginTop: '12px', color: '#666', textAlign: 'center'}}>
            Comptes de test disponibles
          </div>
        </div>
      </div>
    </div>
  );
}

function App(){
  console.log('🏠 App - Composant principal chargé');
  
  const { user, loading } = useAuth();
  const [org, setOrg] = useState<{ id:string, slug:string, name:string }|null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<'space' | 'match'>('space');
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Vérifier la configuration une seule fois
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔧 Config - Vérification Supabase');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Config - Variables d\'environnement manquantes');
      setError('Configuration Supabase manquante dans le fichier .env');
    }
  }, []); // Une seule fois

  // Charger les données utilisateur
  useEffect(() => {
    if (!user?.id || dataLoaded) return;
    
    console.log('👤 User Effect - Chargement des données pour:', user.email);
    
    let mounted = true;
    
    async function loadUserData() {
      try {
        console.log('📊 Data - Chargement des organisations...');
        const { data: orgs, error: orgError } = await supa
          .from('org_members_with_org')
          .select('*')
          .eq('user_id', user.id);
        
        if (!mounted) return;
        
        if (orgError) {
          console.error('❌ Data - Erreur chargement orgs:', orgError);
          setError(`Erreur de chargement des organisations: ${orgError.message}`);
          return;
        }
        
        console.log('🏢 Data - Organisations trouvées:', orgs?.length || 0);
        
        if (orgs && orgs.length > 0) {
          const userOrg = orgs[0];
          console.log('✅ Data - Organisation sélectionnée:', userOrg.org_name);
          const orgData = { 
            id: userOrg.org_id, 
            slug: userOrg.org_slug, 
            name: userOrg.org_name || userOrg.name 
          };
          setOrg(orgData);
          
          // Charger les matchs pour cette organisation
          console.log('⚽ Matches - Chargement pour org:', orgData.id);
          const { data: matchesData, error: matchError } = await supa
            .from('matches')
            .select('*')
            .eq('org_id', orgData.id)
            .order('scheduled_at');
          
          if (!mounted) return;
          
          if (matchError) {
            console.error('❌ Matches - Erreur chargement:', matchError);
            setError(`Erreur de chargement des matchs: ${matchError.message}`);
            return;
          }
          
          console.log('📋 Matches - Trouvés:', matchesData?.length || 0);
          setMatches((matchesData as any) || []);
          
        } else {
          console.warn('⚠️ Data - Aucune organisation trouvée');
          setError('Aucune organisation trouvée pour cet utilisateur');
        }
        
        setDataLoaded(true);
        
      } catch (err) {
        if (!mounted) return;
        console.error('💥 Data - Erreur inattendue:', err);
        setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    }
    
    loadUserData();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, dataLoaded]); // Dépendances spécifiques

  // Reset quand l'utilisateur change
  useEffect(() => {
    if (!user) {
      console.log('🔄 Reset - Utilisateur déconnecté');
      setOrg(null);
      setMatches([]);
      setDataLoaded(false);
      setCurrentPage('space');
      setSelectedMatch(null);
      setError('');
    }
  }, [user?.id]); // Seulement quand l'ID change

  const handleMatchSelect = useCallback((match: MatchInfo) => {
    console.log('🎯 Navigation - Sélection du match:', match.name);
    console.log('🎯 Navigation - Match ID:', match.id);
    setSelectedMatch(match);
    setCurrentPage('match');
    console.log('🎯 Navigation - Changement de page vers match');
  }, []);

  const handleBackToSpace = useCallback(() => {
    console.log('🔙 Navigation - Retour à l\'espace');
    setCurrentPage('space');
    setSelectedMatch(null);
    console.log('🔙 Navigation - Changement de page vers space');
  }, []);

  const handleMatchesUpdate = useCallback((updatedMatches: MatchInfo[]) => {
    console.log('🔄 Update - Mise à jour des matchs:', updatedMatches.length);
    setMatches(updatedMatches);
  }, []);

  // Mémoriser les props pour éviter les re-rendus
  const spacePageProps = useMemo(() => ({
    user,
    org,
    orgs: org ? [org] : [],
    matches,
    onMatchSelect: handleMatchSelect,
    onMatchesUpdate: handleMatchesUpdate
  }), [user, org, matches, handleMatchSelect, handleMatchesUpdate]);

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    console.log('⏳ Render - Chargement de l\'authentification...');
    return (
      <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
        <div className="card" style={{width:360, textAlign:'center'}}>
          <div className="loading">
            <div>⏳ Chargement de l'Operator...</div>
            <div className="small" style={{marginTop:'10px', color:'#666'}}>
              Vérification de l'authentification...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher les erreurs
  if (error) {
    console.log('❌ Render - Affichage de l\'erreur:', error);
    return (
      <div className="space-page" style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
        <div className="card" style={{width:400, textAlign:'center'}}>
          <h2 className="h1" style={{color:'#ff6b6b'}}>⚠️ Erreur</h2>
          <div style={{color:'#ff6b6b', marginBottom:'16px'}}>{error}</div>
          <button onClick={() => window.location.reload()} className="primary">
            🔄 Recharger la page
          </button>
          <div className="small" style={{marginTop:'16px', color:'#666'}}>
            Vérifiez la console (F12) pour plus de détails
          </div>
        </div>
      </div>
    );
  }

  // Afficher la page de connexion si pas d'utilisateur
  if (!user) {
    console.log('🔐 Render - Affichage de la page de connexion');
    return <Login />;
  }

  console.log('✅ Render - Affichage de l\'interface principale');
  console.log('📊 State - État actuel:', { 
    user: user?.email, 
    org: org?.name, 
    matchesCount: matches.length, 
    currentPage 
  });

  // Navigation entre les pages
  if (currentPage === 'match' && selectedMatch) {
    console.log('🎮 Render - Page de match');
    return (
      <MatchPage 
        match={selectedMatch} 
        onBack={handleBackToSpace}
      />
    );
  }

  console.log('🏠 Render - Page d\'espace');
  return <SpacePage {...spacePageProps} />;
}

console.log('🎯 Main - Initialisation du root React');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Main - Élément root non trouvé !');
} else {
  console.log('✅ Main - Élément root trouvé, création de l\'app');
  const root = createRoot(rootElement);
  root.render(<React.StrictMode><App/></React.StrictMode>);
  console.log('🚀 Main - Application React montée');
}