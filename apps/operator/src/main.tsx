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

  // Auth et chargement initial
  useEffect(() => {
    console.log('🔐 Auth - Initialisation');
    
    async function initAuth() {
      try {
        console.log('🔍 Auth - Vérification utilisateur...');
        const { data: { user }, error: userError } = await supa.auth.getUser();
        
        if (userError) {
          console.error('❌ Auth - Erreur utilisateur:', userError);
          setError(`Erreur d'authentification: ${userError.message}`);
          setLoading(false);
          return;
        }
        
        console.log('👤 Auth - Utilisateur:', user?.email || 'Aucun');
        setUser(user);
        
        if (user) {
          await loadUserData(user);
        }
      } catch (err) {
        console.error('💥 Auth - Erreur inattendue:', err);
        setError(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // Écouter les changements d'auth
    const { data: { subscription } } = supa.auth.onAuthStateChange(async (event, session) => {
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
        setLoading(true);
        await loadUserData(session.user);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fonction pour charger les données utilisateur
  async function loadUserData(user: any) {
    try {
      console.log('📊 Data - Chargement pour utilisateur:', user.email);
      setError('');
      
      // Charger les organisations
      console.log('🏢 Chargement des organisations...');
      const { data: orgs, error: orgError } = await supa
        .from('org_members_with_org')
        .select('*')
        .eq('user_id', user.id);

      if (orgError) {
        console.error('❌ Erreur organisations:', orgError);
        setError(`Erreur organisations: ${orgError.message}`);
        return;
      }

      console.log('🏢 Organisations trouvées:', orgs?.length || 0);

      if (!orgs || orgs.length === 0) {
        console.warn('⚠️ Aucune organisation pour cet utilisateur');
        setError('Aucune organisation trouvée pour cet utilisateur. Contactez un administrateur.');
        return;
      }

      const userOrg = orgs[0];
      const orgData = {
        id: userOrg.org_id,
        slug: userOrg.org_slug,
        name: userOrg.org_name
      };
      
      console.log('🏢 Organisation sélectionnée:', orgData.name);
      setOrg(orgData);

      // Charger les matchs
      console.log('📋 Chargement des matchs...');
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
      console.error('💥 Erreur inattendue lors du chargement:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
  }

  // Fonctions de navigation
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

  // Affichage de chargement
  if (loading) {
    console.log('⏳ Affichage du loader');
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b0b0c',
        color: '#eaeaea',
        fontFamily: 'Inter, ui-sans-serif, system-ui'
      }}>
        <div style={{
          background: '#111214',
          border: '1px solid #1b1c1f',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Chargement...</div>
          <div style={{ fontSize: '14px', color: '#9aa0a6' }}>Initialisation de l'Operator</div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    console.log('❌ Affichage de l\'erreur:', error);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b0b0c',
        color: '#eaeaea',
        fontFamily: 'Inter, ui-sans-serif, system-ui'
      }}>
        <div style={{
          background: '#111214',
          border: '1px solid #1b1c1f',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#ff6b6b' }}>⚠️</div>
          <h2 style={{ color: '#ff6b6b', margin: '0 0 16px 0' }}>Erreur</h2>
          <div style={{ color: '#ff6b6b', marginBottom: '24px', lineHeight: '1.5' }}>{error}</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: '#2563eb',
                border: '1px solid #2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔄 Recharger
            </button>
            <button 
              onClick={() => supa.auth.signOut()} 
              style={{
                background: '#dc2626',
                border: '1px solid #dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage du login
  if (!user) {
    console.log('🔐 Affichage du login');
    return <Login />;
  }

  // Affichage de la page match
  if (currentPage === 'match' && selectedMatch) {
    console.log('🎯 Affichage de la page match');
    return (
      <MatchPage 
        match={selectedMatch} 
        onBack={handleBackToSpace}
      />
    );
  }

  // Affichage de la page espace
  console.log('🏠 Affichage de la page espace');
  return (
    <SpacePage 
      user={user}
      org={org}
      matches={matches}
      onMatchSelect={handleMatchSelect}
      onMatchesUpdate={handleMatchesUpdate}
    />
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  console.log('🔐 Affichage du composant Login');
  
  async function submit() {
    if (!email.trim() || !password.trim()) {
      setMsg('Veuillez remplir tous les champs');
      return;
    }
    
    setSubmitting(true);
    setMsg('Connexion en cours...');
    
    try {
      if (mode === 'signin') {
        console.log('🔐 Tentative de connexion pour:', email);
        const { data, error } = await supa.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error('❌ Erreur de connexion:', error);
          setMsg(`Erreur de connexion: ${error.message}`);
        } else {
          console.log('✅ Connexion réussie pour:', data.user?.email);
          setMsg('Connexion réussie !');
        }
      } else {
        console.log('📝 Tentative d\'inscription pour:', email);
        const { data, error } = await supa.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) {
          console.error('❌ Erreur d\'inscription:', error);
          setMsg(`Erreur d'inscription: ${error.message}`);
        } else {
          console.log('✅ Inscription réussie pour:', data.user?.email);
          setMsg('Compte créé ! Vérifiez votre email ou connectez-vous directement.');
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0b0b0c',
      color: '#eaeaea',
      fontFamily: 'Inter, ui-sans-serif, system-ui',
      padding: '20px'
    }}>
      <div style={{
        background: '#111214',
        border: '1px solid #1b1c1f',
        borderRadius: '14px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '24px',
          textAlign: 'center'
        }}>
          🎮 Connexion Opérateur
        </h2>
        
        <div style={{ 
          fontSize: '14px', 
          color: '#9aa0a6', 
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          Accédez à votre espace de gestion des matchs
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            style={{
              background: '#121316',
              color: '#eaeaea',
              border: '1px solid #202327',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '16px',
              minHeight: '48px',
              boxSizing: 'border-box',
              width: '100%'
            }}
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="Votre email"
            type="email"
            disabled={submitting}
            autoComplete="email"
          />
          
          <input 
            style={{
              background: '#121316',
              color: '#eaeaea',
              border: '1px solid #202327',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '16px',
              minHeight: '48px',
              boxSizing: 'border-box',
              width: '100%'
            }}
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="Votre mot de passe"
            disabled={submitting}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          
          <button 
            onClick={submit} 
            disabled={submitting || !email.trim() || !password.trim()}
            style={{
              background: submitting || !email.trim() || !password.trim() ? '#374151' : '#2563eb',
              border: '1px solid ' + (submitting || !email.trim() || !password.trim() ? '#374151' : '#2563eb'),
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              minHeight: '48px',
              cursor: submitting || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontWeight: '500'
            }}
          >
            {submitting ? '⏳ Connexion...' : (mode === 'signin' ? '🔑 Se connecter' : '📝 Créer un compte')}
          </button>
          
          <button 
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            disabled={submitting}
            style={{
              background: 'transparent',
              border: '1px solid #202327',
              color: '#9aa0a6',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {mode === 'signin' ? '📝 Créer un nouveau compte' : '🔑 J\'ai déjà un compte'}
          </button>
          
          {/* Aide pour les utilisateurs */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {mode === 'signin' ? (
              <>
                💡 <strong>Compte de test disponible :</strong><br/>
                Email: gilles.guerrin49@gmail.com<br/>
                (Créez votre mot de passe si première connexion)
              </>
            ) : (
              <>
                📝 <strong>Nouveau compte :</strong><br/>
                Entrez votre email et choisissez un mot de passe sécurisé
              </>
            )}
          </div>
          
          {msg && (
            <div style={{
              color: msg.includes('Erreur') ? '#ff6b6b' : msg.includes('réussie') || msg.includes('créé') ? '#4ade80' : '#fbbf24',
              textAlign: 'center',
              padding: '12px',
              background: msg.includes('Erreur') ? 'rgba(255, 107, 107, 0.1)' : 
                         msg.includes('réussie') || msg.includes('créé') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              border: `1px solid ${msg.includes('Erreur') ? 'rgba(255, 107, 107, 0.3)' : 
                                  msg.includes('réussie') || msg.includes('créé') ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {msg}
            </div>
          )}
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