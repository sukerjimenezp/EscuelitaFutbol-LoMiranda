import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import { Users, UserPlus, Trash2, RefreshCw, Shield, Eye, EyeOff } from 'lucide-react';
import './Profiles.css';

const ROLES = [
  { value: 'superadmin', label: '⚙️ Super Admin', color: '#8b5cf6', desc: 'Acceso total al sistema' },
  { value: 'dt',         label: '🏆 Director Técnico', color: '#0ea5e9', desc: 'Gestión de jugadores y entrenamientos' },
  { value: 'contador',   label: '💼 Contador', color: '#f59e0b', desc: 'Acceso solo a finanzas y reportes' },
  { value: 'parent',     label: '👪 Apoderado', color: '#10b981', desc: 'Ver progreso de sus hijos' },
  { value: 'player',     label: '⚽ Jugador', color: '#38bdf8', desc: 'Perfil personal y estadísticas' },
];

const Profiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'player',
  });

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  const notify = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      notify('error', 'Completa todos los campos obligatorios.');
      return;
    }
    setCreating(true);

    // 1. Create auth user via Supabase Admin (signUp)
    const { data: authData, error: authError } = await supabase.auth.admin
      ? supabase.auth.admin.createUser({
          email: form.email,
          password: form.password,
          email_confirm: true,
          user_metadata: { full_name: form.full_name }
        })
      : await supabase.auth.signUp({ email: form.email, password: form.password });

    if (authError) {
      notify('error', 'Error al crear usuario: ' + authError.message);
      setCreating(false);
      return;
    }

    // 2. Upsert profile with role
    const userId = authData?.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
      });
    }

    notify('success', `✅ Perfil de ${form.full_name} creado con rol "${form.role}".`);
    setForm({ full_name: '', email: '', password: '', role: 'player' });
    setShowForm(false);
    fetchProfiles();
    setCreating(false);
  };

  const handleDelete = async (profile) => {
    if (profile.id === user?.id) { notify('error', 'No puedes eliminar tu propio perfil.'); return; }
    if (!window.confirm(`¿Eliminar a ${profile.full_name}?`)) return;
    await supabase.from('profiles').delete().eq('id', profile.id);
    notify('success', `Perfil de ${profile.full_name} eliminado.`);
    fetchProfiles();
  };

  const handleRoleChange = async (profile, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    fetchProfiles();
  };

  const roleInfo = (role) => ROLES.find(r => r.value === role) || { color: '#64748b', label: role };

  return (
    <div className="profiles-page">
      {/* Header */}
      <div className="profiles-header">
        <div>
          <h1>👥 Gestión de <span className="text-sky">Perfiles</span></h1>
          <p className="profiles-subtitle">{profiles.length} usuarios registrados</p>
        </div>
        <div className="profiles-header-actions">
          <button className="btn-refresh" onClick={fetchProfiles}><RefreshCw size={16} /></button>
          <button className="btn-new-profile" onClick={() => setShowForm(!showForm)}>
            <UserPlus size={18} /> Nuevo Perfil
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback.msg && (
        <div className={`profiles-feedback ${feedback.type}`}>{feedback.msg}</div>
      )}

      {/* Roles Reference */}
      <div className="roles-reference glass">
        {ROLES.map(r => (
          <div key={r.value} className="role-chip" style={{ borderColor: r.color + '44', background: r.color + '11' }}>
            <span className="role-chip-name" style={{ color: r.color }}>{r.label}</span>
            <span className="role-chip-desc">{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="profile-form-wrap glass">
          <h3><UserPlus size={18} /> Crear Nuevo Usuario</h3>
          <form className="profile-form" onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input type="email" placeholder="correo@ejemplo.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contraseña *</label>
                <div className="input-pw-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
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
            <div className="form-actions">
              <button type="button" className="btn-cancel-form" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-create-profile" disabled={creating}>
                {creating ? '⏳ Creando...' : '✅ Crear Perfil'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles List */}
      {loading ? (
        <div className="profiles-loading"><div className="spinner"></div><p>Cargando perfiles...</p></div>
      ) : (
        <div className="profiles-table-wrap glass">
          <table className="profiles-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Creado</th>
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
                        <div className="profile-avatar-mini" style={{ background: role.color + '22', color: role.color }}>
                          {(p.full_name || p.email || '?').charAt(0).toUpperCase()}
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
                    <td className="date-cell">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td>
                      {p.id !== user?.id && (
                        <button className="btn-delete-profile" onClick={() => handleDelete(p)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <div className="profiles-empty"><Shield size={40} /><p>No hay perfiles registrados.</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profiles;
