import React, { useState } from 'react';
import type { MatchInfo, Sport } from '@pkg/types';
import { supa } from '../supabase';

const SPORTS: Sport[] = ['basic','football','handball','basket','hockey_ice','hockey_field','volleyball'];

interface SpacePageProps {
  user: any;
  org: { id: string, slug: string, name: string } | null;
  matches: MatchInfo[];
  onMatchSelect: (match: MatchInfo) => void;
  onMatchesUpdate: (matches: MatchInfo[]) => void;
}

interface MatchFormData {
  name: string;
  sport: Sport;
  home_name: string;
  away_name: string;
  home_logo?: string;
  away_logo?: string;
  date: string;
  time: string;
}

export function SpacePage({ user, org, matches, onMatchSelect, onMatchesUpdate }: SpacePageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [form, setForm] = useState<MatchFormData>({ 
    name: 'Match', 
    sport: 'basic' as Sport, 
    home_name: 'HOME', 
    away_name: 'AWAY', 
    home_logo: '',
    away_logo: '',
    date: '', 
    time: '' 
  });
  const [createMsg, setCreateMsg] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Séparer les matchs en cours/à venir et archivés
  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'live');
  const archivedMatches = matches.filter(m => m.status === 'finished' || m.status === 'archived');

  function scheduleISO() { 
    if (!form.date) return new Date().toISOString(); 
    const hhmm = (form.time || '00:00').split(':'); 
    const d = new Date(`${form.date}T${hhmm[0].padStart(2,'0')}:${(hhmm[1] || '00').padStart(2,'0')}:00`); 
    return d.toISOString(); 
  }

  function resetForm() {
    setForm({
      name: 'Match',
      sport: 'basic' as Sport,
      home_name: 'HOME',
      away_name: 'AWAY',
      home_logo: '',
      away_logo: '',
      date: '',
      time: ''
    });
    setCreateMsg('');
  }

  function openCreateModal() {
    setIsEditing(false);
    resetForm();
    setShowCreateModal(true);
  }

  function openEditModal(match: MatchInfo) {
    setIsEditing(true);
    setEditingMatchId(match.id);
    const matchDate = new Date(match.scheduled_at);
    setForm({
      name: match.name,
      sport: match.sport,
      home_name: match.home_name,
      away_name: match.away_name,
      home_logo: (match as any).home_logo || '',
      away_logo: (match as any).away_logo || '',
      date: matchDate.toISOString().split('T')[0],
      time: matchDate.toTimeString().substring(0, 5)
    });
    setShowEditModal(true);
  }

  function closeModals() {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingMatchId(null);
    setIsEditing(false);
    resetForm();
  }

  function handleImageUpload(file: File, team: 'home' | 'away') {
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setCreateMsg('Erreur: Veuillez sélectionner un fichier image');
      setTimeout(() => setCreateMsg(''), 3000);
      return;
    }
    
    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setCreateMsg('Erreur: L\'image doit faire moins de 2MB');
      setTimeout(() => setCreateMsg(''), 3000);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setForm(prev => ({
        ...prev,
        [team === 'home' ? 'home_logo' : 'away_logo']: result
      }));
    };
    reader.readAsDataURL(file);
  }

  function removeImage(team: 'home' | 'away') {
    setForm(prev => ({
      ...prev,
      [team === 'home' ? 'home_logo' : 'away_logo']: ''
    }));
  }

  function scheduleISO() { 
    if (!form.date) return new Date().toISOString(); 
    const hhmm = (form.time || '00:00').split(':'); 
    const d = new Date(`${form.date}T${hhmm[0].padStart(2,'0')}:${(hhmm[1] || '00').padStart(2,'0')}:00`); 
    return d.toISOString();
  }

  function startEditMatch(match: MatchInfo) {
    const matchDate = new Date(match.scheduled_at);
    setEditingMatch(match.id);
    setEditForm({
      name: match.name,
      sport: match.sport,
      home_name: match.home_name,
      away_name: match.away_name,
      date: matchDate.toISOString().split('T')[0],
      time: matchDate.toTimeString().substring(0, 5)
    });
  }

  function cancelEdit() {
    setEditingMatch(null);
    setEditForm(null);
  async function handleSubmit() {
    if (isEditing) {
      await saveEditMatch();
    } else {
      await createMatch();
    }
  }

  async function saveEditMatch() {
    if (!editingMatchId) return;
    
    try {
      const { data, error } = await supa
        .from('matches')
        .update({
          name: form.name,
          sport: form.sport,
          home_name: form.home_name,
          away_name: form.away_name,
          home_logo: form.home_logo || null,
          away_logo: form.away_logo || null,
          scheduled_at: scheduleISO(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingMatchId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Update error:', error);
        setCreateMsg(`Erreur lors de la modification: ${error.message}`);
        setTimeout(() => setCreateMsg(''), 5000);
        return;
      }
      
      const updatedMatches = matches.map(m => 
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
        home_logo: form.home_logo || null,
        away_logo: form.away_logo || null,
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
      setTimeout(() => {
        closeModals();
      }, 1500);
      
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

  return (
    <div className="space-page">
      <div className="card">
        <div className="space-header">
          <h1 className="h1">⚽ Scoreboard Pro</h1>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="org-section">
              <strong>{org?.name || 'Aucun espace disponible'}</strong>
              {org && (
                <button 
                  onClick={openCreateModal}
                  className="add-match-btn"
                  title="Ajouter un nouveau match"
                >
                  ➕ Ajouter un match
                </button>
              )}
            </div>
            <button 
              onClick={() => supa.auth.signOut()} 
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="sep" />
        
        <h2 className="h1">Matchs à venir ({upcomingMatches.length})</h2>
        <div className="matches-list">
          {upcomingMatches.map(m => (
            <MatchRow 
              key={m.id} 
              match={m} 
              onSelect={() => onMatchSelect(m)}
              onEdit={() => openEditModal(m)}
              onDelete={() => deleteMatch(m.id)}
            />
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
                <MatchRow 
                  key={m.id} 
                  match={m} 
                  onSelect={() => onMatchSelect(m)}
                  archived={true}
                />
              ))}
            </div>
          </>
        )}

        {/* Modal de création/modification de match */}
        {(showCreateModal || showEditModal) && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditing ? '✏️ Modifier le match' : '➕ Nouveau match'}</h2>
                <button 
                  className="modal-close"
                  onClick={closeModals}
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-row">
                    <label>Nom du match</label>
                    <input 
                      className="input" 
                      placeholder="Ex: Finale championnat" 
                      value={form.name} 
                      onChange={e => setForm({ ...form, name: e.target.value })} 
                    />
                  </div>
                  
                  <div className="form-row">
                    <label>Sport</label>
                    <select 
                      className="input"
                      value={form.sport} 
                      onChange={e => setForm({ ...form, sport: e.target.value as Sport })}
                    >
                      {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-row-split">
                    <div className="form-field">
                      <label>Équipe A</label>
                      <input 
                        className="input" 
                        placeholder="Nom équipe A" 
                        value={form.home_name} 
                        onChange={e => setForm({ ...form, home_name: e.target.value })} 
                      />
                      <div className="logo-upload">
                        <label className="logo-upload-label">
                          📷 Logo équipe A
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'home')}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {form.home_logo && (
                          <div className="logo-preview">
                            <img src={form.home_logo} alt="Logo équipe A" />
                            <button 
                              type="button" 
                              onClick={() => removeImage('home')}
                              className="logo-remove"
                              title="Supprimer le logo"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Équipe B</label>
                      <input 
                        className="input" 
                        placeholder="Nom équipe B" 
                        value={form.away_name} 
                        onChange={e => setForm({ ...form, away_name: e.target.value })} 
                      />
                      <div className="logo-upload">
                        <label className="logo-upload-label">
                          📷 Logo équipe B
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'away')}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {form.away_logo && (
                          <div className="logo-preview">
                            <img src={form.away_logo} alt="Logo équipe B" />
                            <button 
                              type="button" 
                              onClick={() => removeImage('away')}
                              className="logo-remove"
                              title="Supprimer le logo"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row-split">
                    <div className="form-field">
                      <label>Date</label>
                      <input 
                        className="input" 
                        type="date" 
                        value={form.date} 
                        onChange={e => setForm({ ...form, date: e.target.value })} 
                      />
                    </div>
                    <div className="form-field">
                      <label>Heure</label>
                      <input 
                        className="input" 
                        type="time" 
                        value={form.time} 
                        onChange={e => setForm({ ...form, time: e.target.value })} 
                      />
                    </div>
                  </div>
                  
                  {createMsg && (
                    <div className="form-message" style={{ 
                      color: createMsg.includes('Erreur') ? '#ff6b6b' : '#4ade80' 
                    }}>
                      {createMsg}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  onClick={closeModals}
                  className="secondary"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSubmit}
                  className="primary"
                  disabled={!form.name.trim()}
                >
                  {isEditing ? '✅ Sauvegarder' : '✅ Créer le match'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher une ligne de match
function MatchRow({ match, onSelect, onEdit, onDelete, archived = false }: {
  match: MatchInfo;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  archived?: boolean;
}) {
  return (
    <div className={`match-row ${archived ? 'archived' : ''}`}>
      <div className="match-details">
        <div className="match-name">{match.name}</div>
        <div className="match-teams">
          {(match as any).home_logo && (
            <img src={(match as any).home_logo} alt="Logo" className="team-logo-small" />
          )}
          {match.home_name} vs {match.away_name}
          {(match as any).away_logo && (
            <img src={(match as any).away_logo} alt="Logo" className="team-logo-small" />
          )}
        </div>
        <div className="match-sport">
          <span className="sport-badge">{match.sport}</span>
        </div>
      </div>
      <div className="match-datetime">
        <div className="match-date">{new Date(match.scheduled_at).toLocaleDateString('fr-FR')}</div>
        <div className="match-time">{new Date(match.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div className="match-actions">
        <button 
          onClick={onSelect} 
          className={archived ? '' : 'primary'}
          style={archived ? { background: '#6b7280', borderColor: '#6b7280' } : {}}
        >
          Sélectionner
        </button>
        {!archived && onEdit && (
          <button 
            onClick={onEdit} 
            style={{ background: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}
          >
            ✏️ Modifier
          </button>
        )}
        {!archived && onDelete && (
          <button 
            onClick={onDelete} 
            className="danger"
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
}