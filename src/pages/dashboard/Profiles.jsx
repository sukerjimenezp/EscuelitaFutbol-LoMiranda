import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import { Users, UserPlus, Trash2, RefreshCw, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Profiles.css';

const ROLES = [
  { value: 'superadmin', label: '⚙️ Super Admin',      color: '#8b5cf6', desc: 'Acceso total al sistema' },
  { value: 'dt',         label: '🏆 Director Técnico', color: '#0ea5e9', desc: 'Gestión de jugadores y entrenamientos' },
  { value: 'contador',   label: '💼 Contador',         color: '#f59e0b', desc: 'Acceso solo a finanzas y reportes' },
  { value: 'parent',     label: '👪 Apoderado',        color: '#10b981', desc: 'Ver progreso de sus hijos' },
  { value: 'player',     label: '⚽ Jugador',          color: '#38bdf8', desc: 'Perfil personal y estadísticas' },
];

const Profiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback]     = useState({ type: '', msg: '' });
  const [editingProfile, setEditingProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'player', avatar_url: '' });
  const [skins, setSkins] = useState([]);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setFeedback({ type: '', msg: '' }); // Clear old feedback
    try {
      // Robust select to ensure Chrome doesn't hang on obscure columns
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Primary fetch failed, attempting fallback...', error.message);
        // Fallback without created_at if it's missing from schema
        const { data: fallbackData, error: fbError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, avatar_url');
        
        if (fbError) throw fbError;
        setProfiles(fallbackData || []);
      } else {
        setProfiles(data || []);
      }

      // Fetch skins for selection
      const { data: skinsData } = await supabase.from('skins').select('*');
      setSkins(skinsData || []);

    } catch (err) {
      console.error('fetchProfiles error:', err);
      notify('error', 'Error al cargar perfiles: ' + err.message);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 5000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || (!editingProfile && !form.password)) {
      notify('error', 'Completa todos los campos obligatorios.');
      return;
    }
    setCreating(true);

    try {
      if (editingProfile) {
        // --- MODO EDICIÓN ---
        const { error } = await supabase
          .from('profiles')
          .update({ 
            full_name: form.full_name, 
            role: form.role,
            avatar_url: form.avatar_url 
          })
          .eq('id', editingProfile.id);

        if (error) throw error;
        notify('success', `✅ Perfil de ${form.full_name} actualizado.`);
      } else {
        // --- MODO CREACIÓN ---
        if (form.password.length < 6) {
          notify('error', 'La contraseña debe tener al menos 6 caracteres.');
          setCreating(false);
          return;
        }

        // 1. Intentar signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name } }
        });

        if (authError) {
          // Si el usuario ya existe, intentamos solo insertar en profiles
          if (authError.message.includes('already registered')) {
             const { error: upsertErr } = await supabase.from('profiles').upsert({
               email: form.email,
               full_name: form.full_name,
               role: form.role
             });
             if (upsertErr) throw upsertErr;
             notify('success', `✅ Usuario ya existía. Perfil actualizado.`);
          } else {
            throw authError;
          }
        } else {
          const userId = authData?.user?.id;
          if (userId) {
            await supabase.from('profiles').upsert({
              id: userId,
              email: form.email,
              full_name: form.full_name,
              role: form.role,
            });
            notify('success', `✅ Perfil creado. Se envió correo de confirmación.`);
          }
        }
      }

      setForm({ full_name: '', email: '', password: '', role: 'player' });
      setShowForm(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (err) {
      console.error('Error in handleSave:', err);
      notify('error', 'Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (profile) => {
    setEditingProfile(profile);
    setForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      password: '', // No editamos password aquí por seguridad
      role: profile.role || 'player',
      avatar_url: profile.avatar_url || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (profile) => {
    if (profile.id === user?.id) { notify('error', 'No puedes eliminar tu propio perfil.'); return; }
    if (!window.confirm(`¿Eliminar el perfil de ${profile.full_name || profile.email}?`)) return;
    await supabase.from('profiles').delete().eq('id', profile.id);
    notify('success', `Perfil eliminado.`);
    fetchProfiles();
  };

  const handleRoleChange = async (profile, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (!error) fetchProfiles();
    else notify('error', 'Error al cambiar rol: ' + error.message);
  };

  const roleInfo = (role) => ROLES.find(r => r.value === role) || { color: '#64748b', label: role };

  return (
    <div className="profiles-page">
      {/* Header */}
      <div className="profiles-header">
        <div>
          <h1>👥 Gestión de <span className="text-sky">Perfiles</span></h1>
          <p className="profiles-subtitle">{profiles.length} usuario{profiles.length !== 1 ? 's' : ''} registrado{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="profiles-header-actions">
          <button className="btn-refresh" onClick={fetchProfiles} title="Recargar"><RefreshCw size={16} /></button>
          <button className="btn-new-profile" onClick={() => setShowForm(!showForm)}>
            <UserPlus size={18} /> Nuevo Perfil
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback.msg && (
        <div className={`profiles-feedback ${feedback.type}`}>{feedback.msg}</div>
      )}

      {/* Info box */}
      <div className="profiles-info-box">
        <AlertCircle size={15} />
        <span>El nuevo usuario recibirá un correo de confirmación de Supabase. Puede ingresar inmediatamente con la contraseña asignada.</span>
      </div>

      {/* Roles Reference */}
      <div className="roles-reference glass">
        {ROLES.map(r => (
          <div key={r.value} className="role-chip" style={{ borderColor: r.color + '44', background: r.color + '11' }}>
            <span className="role-chip-name" style={{ color: r.color }}>{r.label}</span>
            <span className="role-chip-desc">{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={`profile-form-wrap glass ${editingProfile ? 'editing' : ''}`}>
          <h3>
            {editingProfile ? <Shield size={18} /> : <UserPlus size={18} />} 
            {editingProfile ? `Editando: ${editingProfile.full_name}` : 'Crear Nuevo Usuario'}
          </h3>
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input type="email" placeholder="correo@ejemplo.com" value={form.email}
                  disabled={!!editingProfile}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            {!editingProfile && (
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña *</label>
                  <div className="input-pw-wrap">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Rol del Sistema *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            )}
            {editingProfile && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rol del Sistema *</label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>URL de Foto de Perfil (Opcional)</label>
                    <input type="text" placeholder="https://..." value={form.avatar_url}
                      onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
                  </div>
                </div>

                <div className="form-group avatar-selection-area">
                  <label>O seleccionar entre Skins disponibles:</label>
                  <div className="avatar-grid-mini">
                    {skins.map(s => (
                      <div 
                        key={s.id} 
                        className={`avatar-option ${form.avatar_url === s.image_url ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, avatar_url: s.image_url })}
                      >
                        <img src={s.image_url} alt={s.name} title={s.name} />
                      </div>
                    ))}
                    {form.avatar_url && (
                      <button type="button" className="btn-clear-avatar" onClick={() => setForm({ ...form, avatar_url: '' })}>
                        Quitar Foto
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="form-actions">
              <button type="button" className="btn-cancel-form" onClick={() => { setShowForm(false); setEditingProfile(null); }}>Cancelar</button>
              <button type="submit" className="btn-create-profile" disabled={creating}>
                {creating ? '⏳ Guardando...' : (editingProfile ? '💾 Actualizar Cambios' : '✅ Crear Perfil')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="profiles-loading">
          <div className="spinner"></div>
          <p>Cargando perfiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="profiles-table-wrap glass">
          <div className="profiles-empty">
            <Shield size={40} />
            <p>No hay perfiles registrados aún.</p>
            <button className="btn-new-profile" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
              <UserPlus size={16} /> Crear primer perfil
            </button>
          </div>
        </div>
      ) : (
        <div className="profiles-table-wrap glass">
          <table className="profiles-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const role = roleInfo(p.role);
                return (
                  <tr key={p.id} className={p.id === user?.id ? 'own-row' : ''}>
                    <td>
                      <div className="profile-name-cell">
                        <div className="profile-avatar-mini" style={{ background: p.avatar_url ? 'none' : role.color + '22', color: role.color }}>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="Avatar" className="mini-img" />
                          ) : (
                            (p.full_name || p.email || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span>{p.full_name || '—'}</span>
                        {p.id === user?.id && <span className="you-badge">Tú</span>}
                      </div>
                    </td>
                    <td className="email-cell">{p.email}</td>
                    <td>
                      <select
                        className="role-select-inline"
                        value={p.role || ''}
                        onChange={e => handleRoleChange(p, e.target.value)}
                        disabled={p.id === user?.id}
                        style={{ borderColor: role.color + '55', color: role.color }}
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="actions-cell">
                      <div className="profiles-actions-wrap">
                        <button className="btn-edit-profile" onClick={() => startEdit(p)} title="Editar">
                          <Shield size={14} />
                        </button>
                        {p.id !== user?.id && (
                          <button className="btn-delete-profile" onClick={() => handleDelete(p)} title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Profiles;
