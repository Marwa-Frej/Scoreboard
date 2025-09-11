import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo } from '@pkg/types';
import { supa } from './supabase';
import { SpacePage } from './components/SpacePage';
import { MatchPage } from './components/MatchPage';

function useAuth(){
  const [user, setUser] = useState<any>(null);
  useEffect(()=>{ supa.auth.getUser().then(r=>setUser(r.data.user||null)); const { data: { subscription } } = supa.auth.onAuthStateChange((_e, s)=> setUser(s?.user||null)); return ()=>subscription.unsubscribe(); }, []);
  return { user };
}

function Login(){
  const [email, setEmail] = useState('operator@example.com');
  const [password, setPassword] = useState('demo-demo');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState<string>('');
  async function submit(){
    setMsg('');
    if (mode==='signin'){
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { error } = await supa.auth.signUp({ email, password });
      setMsg(error ? error.message : 'Vérifie tes emails pour confirmer.');
    }
  }
  return <div className="preview" style={{placeItems:'center'}}>
    <div className="card" style={{width:360}}>
      <h2 className="h1">Connexion Opérateur</h2>
      <div className="row"><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/></div>
      <div className="row"><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="mot de passe"/></div>
      <div className="row"><button onClick={submit}>{mode==='signin'?'Se connecter':'Créer un compte'}</button><button onClick={()=>setMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Créer un compte':'J'ai déjà un compte'}</button></div>
      {msg && <div className="small">{msg}</div>}
    </div>
  }
  </div>;
}

function App(){
  const { user } = useAuth();
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

  if (!user) return <Login />;

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