import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo } from '@pkg/types';
import { supa } from './supabase';
import { SpacePage } from './components/SpacePage';
import { MatchPage } from './components/MatchPage';

function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    supa.auth.getUser().then(r=>{
      setUser(r.data.user||null);
      setLoading(false);
    });
    
    const { data: { subscription } } = supa.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
}

function Login(){
  const [email, setEmail] = useState('operator@example.com');
  const [password, setPassword] = useState('demo-demo');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  async function submit(){
    setSubmitting(true);
    setMsg('');
    try {
      if (mode==='signin'){
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) setMsg(`Erreur de connexion: ${error.message}`);
      } else {
        const { error } = await supa.auth.signUp({ email, password });
        setMsg(error ? `Erreur d'inscription: ${error.message}` : 'Vérifie tes emails pour confirmer.');
      }
    } catch (err) {
      setMsg(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
    setSubmitting(false);
  }
  
  return <div className="preview" style={{placeItems:'center'}}>
    <div className="card" style={{width:360}}>
      <h2 className="h1">Connexion Opérateur</h2>
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
  </div>;
}

function App(){
  const { user, loading } = useAuth();
  const [org, setOrg] = useState<{ id:string, slug:string, name:string }|null>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<'space' | 'match'>('space');
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);

  useEffect(()=>{ 
    if (!user) return;
    (async () => {
      const { data: orgs } = await supa.from('org_members_with_org').select('*').eq('user_id', user.id);
      setOrgs(orgs || []);
      if (orgs && orgs.length > 0) {
        const userOrg = orgs[0];
        setOrg({ 
          id: userOrg.org_id, 
          slug: userOrg.org_slug, 
          name: userOrg.org_name || userOrg.name 
        });
      }
    })();
  }, [user]);

  useEffect(()=>{ 
    if (!org?.id) return; 
    (async()=>{ 
      const { data } = await supa.from('matches').select('*').eq('org_id', org.id).order('scheduled_at'); 
      setMatches((data as any)||[]); 
    })(); 
  }, [org]);

  function handleMatchSelect(match: MatchInfo) {
    setSelectedMatch(match);
    setCurrentPage('match');
  }

  function handleBackToSpace() {
    setCurrentPage('space');
    setSelectedMatch(null);
  }

  function handleMatchesUpdate(updatedMatches: MatchInfo[]) {
    setMatches(updatedMatches);
  }

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="preview" style={{placeItems:'center'}}>
        <div className="card" style={{width:360, textAlign:'center'}}>
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  // Afficher la page de connexion si pas d'utilisateur
  if (!user) return <Login />;

  // Navigation entre les pages
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
      orgs={orgs}
      matches={matches}
      onMatchSelect={handleMatchSelect}
      onMatchesUpdate={handleMatchesUpdate}
    />
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);