import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import type { MatchInfo, MatchState, Sport } from '@pkg/types';
import { supa } from './supabase';
import { initMatchState, reduce } from './state';
import { Panel } from './components/Panels';
import { createOperatorChannel } from './realtime';
import { applyTick } from '@pkg/logic';

const SPORTS: Sport[] = ['basic','football','handball','basket','hockey_ice','hockey_field','volleyball'];

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
      <div className="row"><button onClick={submit}>{mode==='signin'?'Se connecter':'Créer un compte'}</button><button onClick={()=>setMode(mode==='signin'?'signup':'signin')}>{mode==='signin'?'Créer un compte':'J’ai déjà un compte'}</button></div>
      {msg && <div className="small">{msg}</div>}
    </div>
  </div>;
}

function App(){
  const { user } = useAuth();
  const [org, setOrg] = useState<{ id:string, slug:string, name:string }|null>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [current, setCurrent] = useState<MatchInfo|null>(null);
  const [state, setState] = useState<MatchState|null>(null);
  const [form, setForm] = useState({ name:'Match', sport:'basic' as Sport, home_name:'HOME', away_name:'AWAY', date:'', time:'' });
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [chan, setChan] = useState<any>(null);

  useEffect(()=>{ if (!user) return; (async()=>{
      const { data: orgs } = await supa.from('org_members_with_org').select('*').eq('user_id', user.id);
      setOrgs(orgs||[]);
      if (orgs && orgs.length) setOrg({ id: orgs[0].org_id, slug: orgs[0].org_slug, name: orgs[0].org_name });
  })(); }, [user]);

  useEffect(()=>{ if (!org) return; (async()=>{ const { data } = await supa.from('matches').select('*').eq('org_id', org.id).order('scheduled_at'); setMatches((data as any)||[]); })(); }, [org?.id]);

  useEffect(()=>{ if (!state) return; const id = setInterval(()=> setState(prev => prev ? applyTick(prev) : prev), 100); return ()=>clearInterval(id); }, [state?.matchId]);

  function scheduleISO(){ if (!form.date) return new Date().toISOString(); const hhmm = (form.time||'00:00').split(':'); const d = new Date(`${form.date}T${hhmm[0].padStart(2,'0')}:${(hhmm[1]||'00').padStart(2,'0')}:00`); return d.toISOString(); }
  async function createMatch(){
    if (!org) return;
    const display_token = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const { data, error } = await supa.from('matches').insert({ org_id: org.id, name: form.name, sport: form.sport, home_name: form.home_name, away_name: form.away_name, scheduled_at: scheduleISO(), status: 'scheduled', public_display: true, display_token }).select('*').single();
    if (error) { alert(error.message); return; }
    setMatches(prev => [...prev, data as any]);
  }
  function openMatch(m: MatchInfo){
    setCurrent(m);
    const key = `${m.org_id}:${m.id}`;
    const s = initMatchState(key, m.sport);
    setState(s);
    if (chan) chan.close();
    const c = createOperatorChannel(m.org_slug || 'org', m.id, m.display_token, ()=>{ if (state) c.publish(state, m); }, ()=>{ if (state) c.publish(state, m); });
    setChan(c);
    const u = new URL('http://localhost:5174/'); u.searchParams.set('org', m.org_slug||'org'); u.searchParams.set('match', m.id); u.searchParams.set('token', m.display_token); u.searchParams.set('ui','1'); setDisplayUrl(u.toString());
  }

  function send(type:string, payload?:any){
    if (!state || !chan || !current) return;
    const next = reduce(state, { type, payload });
    setState(next);
    chan.publish(next, current);
  }

  if (!user) return <Login/>;
  return (
    <div className="app">
      <div className="card">
        <h2 className="h1">Espace</h2>
        <div className="row">
          <select value={org?.id||''} onChange={e=>{ const o = orgs.find(x=>x.org_id===e.target.value); setOrg(o?{ id:o.org_id, slug:o.org_slug, name:o.org_name }:null); }}>
            <option value="">Sélectionner un espace...</option>
            {orgs.map(o => <option key={o.org_id} value={o.org_id}>{o.org_name}</option>)}
          </select>
        </div>

        <div className="sep" /><h2 className="h1">Nouveau match</h2>
        <div className="row"><input className="input" placeholder="Nom" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:260}}/></div>
        <div className="row"><label>Sport</label><select value={form.sport} onChange={e=>setForm({...form, sport: e.target.value as Sport})}>{SPORTS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <div className="row"><input className="input" placeholder="Équipe A" value={form.home_name} onChange={e=>setForm({...form, home_name:e.target.value})} style={{width:160}}/>
          <input className="input" placeholder="Équipe B" value={form.away_name} onChange={e=>setForm({...form, away_name:e.target.value})} style={{width:160}}/></div>
        <div className="row"><input className="input" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <input className="input" type="time" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} /><button onClick={createMatch}>Créer</button></div>

        <div className="sep" /><h2 className="h1">Matches</h2>
        <div className="list">{matches.map(m => (<div key={m.id} className="item"><div><div>{m.name} <span className="small">({m.sport})</span></div><div className="small">{new Date(m.scheduled_at).toLocaleString()} • <span className="badge">{m.status}</span></div></div><div className="row"><button onClick={()=>openMatch(m)}>Sélectionner</button></div></div>))}</div>

        {displayUrl && <div className="sep"/ >}
        {displayUrl && <div className="small">Lien Display : <a href={displayUrl} target="_blank">{displayUrl}</a></div>}
      </div>

      <div className="card preview">{!current || !state ? <div className="small">Sélectionne un match…</div> : (
        <div style={{width:'100%', height:'100%', display:'grid', gridTemplateRows:'auto 1fr auto', gap:8}}>
          <div className="row" style={{justifyContent:'space-between'}}><div><strong>{current.name}</strong> — {current.home_name} vs {current.away_name} <span className="small">({state.sport})</span></div>
          <div className="row"><select value={state.sport} onChange={e=>send('sport:set', { sport: e.target.value })}>{SPORTS.map(s=><option key={s} value={s}>{s}</option>)}</select></div></div>
          <div style={{background:'#000', borderRadius:12, border:'1px solid #222', overflow:'hidden'}}><Preview state={state} home={current.home_name} away={current.away_name}/></div>
          <div><div className="row" style={{marginBottom:8}}><button onClick={()=>send('clock:start')}>▶</button><button onClick={()=>send('clock:stop')}>⏸</button><button onClick={()=>send('clock:reset')}>⟲</button><button onClick={()=>send('period:next')}>Période +1</button><span>Score</span><button onClick={()=>send('score:inc',{team:'home'})}>Home +1</button><button onClick={()=>send('score:dec',{team:'home'})}>Home −1</button><button onClick={()=>send('score:inc',{team:'away'})}>Away +1</button><button onClick={()=>send('score:dec',{team:'away'})}>Away −1</button></div><Panel state={state} send={(a,p)=>send(a,p) as any}/></div>
        </div>
      )}</div>
    </div>
  );
}

function Preview({state, home, away}:{state:MatchState, home:string, away:string}){
  const [Comp, setComp] = useState<any>(null);
  useEffect(()=>{ import('./components/Scoreboard').then(m=>setComp(()=>m.Scoreboard)); const l = document.createElement('link'); l.rel='stylesheet'; l.href='/../display/src/theme.css'; document.head.appendChild(l); return ()=>{ document.head.removeChild(l) }; }, []);
  return Comp ? <div style={{padding:16}}><Comp state={state} homeName={home} awayName={away} /></div> : null;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
