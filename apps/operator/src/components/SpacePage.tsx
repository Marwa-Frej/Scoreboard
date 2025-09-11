import React, { useState } from 'react';
import type { MatchInfo, Sport } from '@pkg/types';
import { supa } from '../supabase';

const SPORTS: Sport[] = ['basic','football','handball','basket','hockey_ice','hockey_field','volleyball'];

interface SpacePageProps {
  user: any;
  org: { id: string, slug: string, name: string } | null;
  orgs: any[];
  matches: MatchInfo[];
  onMatchSelect: (match: MatchInfo) => void;
  onMatchesUpdate: (matches: MatchInfo[]) => void;
}

export function SpacePage({ user, org, orgs, matches, onMatchSelect, onMatchesUpdate }: SpacePageProps) {
  const [form, setForm] = useState({ 
    name: 'Match', 
    sport: 'basic' as Sport, 
    home_name: 'HOME', 
    away_name: 'AWAY', 
    date: '', 
    time: '' 
  });
  const [createMsg, setCreateMsg] = useState<string>('');

  // Séparer les matchs en cours/à venir et archivés
  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live');
  const archivedMatches = matches.filter(m => m.status === 'finished' || m.status === 'archived');

  function scheduleISO() { 
    if (!form.date) return new Date().toISOString(); 
    const hhmm = (form.time || '00:00').split(':'); 
    const d = new Date(`${form.date}T${hhmm[0].padStart(2,'0')}:${(hhmm[1] || '00').padStart(2,'0')}:00`); 
    return d.toISOString(); 
  }

  async function createMatch() {
    if (!org) {
      setCreateMsg('Erreur: Veuillez sélectionner un espace d\'abord');
      setTimeout(() => setCreateMsg(''), 5000);
      return;
    }
    if (!form.name.trim()) {
      setCreateMsg('Erreur: Le nom du match est requis');
      setTimeout(() => setCreateMsg(''), 5000);
      return;
    }
    setCreateMsg('Création en cours...');
    
    try {
      const display_token = Math.random().toString(36).substring(2, 15);
      const { data, error } = await supa.from('matches').insert({ 
        org_id: org.id, 
        name: form.name, 
        sport: form.sport, 
        home_name: form.home_name, 
        away_name: form.away_name, 
        scheduled_at: scheduleISO(), 
        status: 'scheduled', 
        public_display: true, 
        display_token 
      }).select('*').single();
      
      if (error) { 
        console.error('Database error:', error);
        setCreateMsg(`Erreur: ${error.message}`);
        setTimeout(() => setCreateMsg(''), 5000);
        return; 
      }
      
      const updatedMatches = [...matches, data as any];
      onMatchesUpdate(updatedMatches);
      setCreateMsg('Match créé avec succès !');
      setTimeout(() => setCreateMsg(''), 3000);
      setForm({ name: 'Match', sport: 'basic' as Sport, home_name: 'HOME', away_name: 'AWAY', date: '', time: '' });
    } catch (err) {
      console.error('Unexpected error:', err);
      setCreateMsg(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setTimeout(() => setCreateMsg(''), 5000);
    }
  }
  
  async function deleteMatch(matchId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
      return;
    }
    
    try {
      const { error } = await supa.from('matches').delete().eq('id', matchId);
      
      if (error) {
        console.error('Delete error:', error);
        alert(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      const updatedMatches = matches.filter(m => m.id !== matchId);
      onMatchesUpdate(updatedMatches);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      alert(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }

  async function archiveMatch(matchId: string) {
    try {
      const { error } = await supa.from('matches').update({ status: 'archived' }).eq('id', matchId);
      
      if (error) {
        console.error('Archive error:', error);
        alert(`Erreur lors de l'archivage: ${error.message}`);
        return;
      }
      
      const updatedMatches = matches.map(m => 
        m.id === matchId ? { ...m, status: 'archived' as const } : m
      );
      onMatchesUpdate(updatedMatches);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      alert(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  }

  async function loadMatches() {
    if (!org?.id) return;
    
    console.log('🔄 SpacePage - Rechargement des matchs demandé');
    try {
      console.log('⚽ Matches - Rechargement pour org:', org.id);
      const { data, error } = await supa
        .from('matches')
        .select('*')
        .eq('org_id', org.id)
        .order('scheduled_at');
      
      if (error) {
        console.error('❌ Matches - Erreur rechargement:', error);
        return;
      }
      
      console.log('📋 Matches - Rechargés:', data?.length || 0);
      onMatchesUpdate((data as any) || []);
    } catch (err) {
      console.error('💥 Matches - Erreur inattendue:', err);
    }
  }

  return (
    <div className="space-page">
      <div className="card">
        <div className="space-header">
          <h1 className="h1">⚽ Scoreboard Pro</h1>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><strong>{org?.name || 'Aucun espace disponible'}</strong></div>
            <button 
              onClick={() => supa.auth.signOut()} 
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="sep" />
        
        <h2 className="h1">Nouveau match</h2>
        <div className="form-grid">
          <div className="row">
            <input 
              className="input" 
              placeholder="Nom du match" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              style={{ width: 260 }}
            />
          </div>
          
          <div className="row">
            <label>Sport</label>
            <select 
              value={form.sport} 
              onChange={e => setForm({ ...form, sport: e.target.value as Sport })}
            >
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="row">
            <input 
              className="input" 
              placeholder="Équipe A" 
              value={form.home_name} 
              onChange={e => setForm({ ...form, home_name: e.target.value })} 
              style={{ width: 160 }}
            />
            <input 
              className="input" 
              placeholder="Équipe B" 
              value={form.away_name} 
              onChange={e => setForm({ ...form, away_name: e.target.value })} 
              style={{ width: 160 }}
            />
          </div>
          
          <div className="row">
            <input 
              className="input" 
              type="date" 
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
            />
            <input 
              className="input" 
              type="time" 
              value={form.time} 
              onChange={e => setForm({ ...form, time: e.target.value })} 
            />
            <button onClick={createMatch} className="primary">Créer</button>
          </div>
          
          {createMsg && (
            <div className="small" style={{ 
              color: createMsg.includes('Erreur') ? '#ff6b6b' : '#4ade80' 
            }}>
              {createMsg}
            </div>
          )}
        </div>

        <div className="sep" />
        
        <h2 className="h1">Matchs à venir ({upcomingMatches.length})</h2>
        <div className="matches-list">
          {upcomingMatches.map(m => (
            <div key={m.id} className="match-row">
              <div className="match-details">
                <div className="match-name">{m.name}</div>
                <div className="match-teams">{m.home_name} vs {m.away_name}</div>
              </div>
              <div className="match-datetime">
                <div className="match-date">{new Date(m.scheduled_at).toLocaleDateString('fr-FR')}</div>
                <div className="match-time">{new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="match-actions">
                <button 
                  onClick={() => onMatchSelect(m)} 
                  className="primary"
                >
                  Sélectionner
                </button>
                <button 
                  onClick={() => deleteMatch(m.id)} 
                  className="danger"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {upcomingMatches.length === 0 && (
            <div className="empty-list">
              <div>Aucun match à venir</div>
              <div className="small">Créez votre premier match ci-dessus</div>
            </div>
          )}
        </div>

        {archivedMatches.length > 0 && (
          <>
            <div className="sep" />
            <h2 className="h1">Matchs archivés ({archivedMatches.length})</h2>
            <div className="matches-list archived">
              {archivedMatches.map(m => (
                <div key={m.id} className="match-row archived">
                  <div className="match-details">
                    <div className="match-name">{m.name}</div>
                    <div className="match-teams">{m.home_name} vs {m.away_name}</div>
                  </div>
                  <div className="match-datetime">
                    <div className="match-date">{new Date(m.scheduled_at).toLocaleDateString('fr-FR')}</div>
                    <div className="match-time">{new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="match-actions">
                    <button 
                      onClick={() => onMatchSelect(m)} 
                      style={{ background: '#6b7280', borderColor: '#6b7280' }}
                    >
                      Sélectionner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}