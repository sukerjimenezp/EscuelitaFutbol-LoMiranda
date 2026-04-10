import React, { useState, useEffect } from 'react';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../lib/supabase';
import { playersByCategory, events, finances } from '../data/mockData';
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Trophy, 
  Activity,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Tv,
  Play,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.jpg';
import './Dashboard.css';

import PlayerProfile from './dashboard/PlayerProfile';

// --- HELPERS ---
const cleanRUT = (rut) => rut.replace(/[.-]/g, '');

const validateRUT = (rut) => {
  const clean = cleanRUT(rut);
  if (clean.length < 8) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  const expectedDv = res === 11 ? '0' : res === 10 ? 'K' : res.toString();
  return dv === expectedDv;
};

const Dashboard = () => {
  const { user } = useAuth();
  
  // Lógica de datos para los widgets
  const myPlayers = playersByCategory[user?.category] || [];
  const nextEvent = events.find(e => e.type === 'match') || events[0];
  const monthsIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);

  // Widget de estadísticas rápidas
  const renderStats = () => {
    switch(user?.role) {
      case 'superadmin':
        return (
          <>
            <StatCard icon={<Users />} label="Jugadores Totales" value="45" color="sky" />
            <StatCard icon={<Trophy />} label="Categorías" value="7" color="green" />
            <StatCard icon={<TrendingUp />} label="Ingresos Marzo" value={`$${monthsIncome.toLocaleString()}`} color="yellow" />
          </>
        );
      case 'dt':
        return (
          <>
            <StatCard icon={<Users />} label="Mi Plantilla" value={myPlayers.length} color="sky" />
            <StatCard icon={<Activity />} label="Asistencia Media" value="85%" color="green" />
            <StatCard icon={<CalendarIcon />} label="Entrenamientos" value="3/semana" color="yellow" />
          </>
        );
      default:
        return null;
    }
  };

  // VISTAS ESPECÍFICAS
  if (user?.role === 'parent') {
    return <ParentDashboardView user={user} />;
  }
  
  if (user?.role === 'player') {
    return <PlayerProfile />;
  }

  return (
    <div className="dashboard-home">
      <div className="welcome-banner glass">
        <div className="welcome-text-group">
          <img src={logo} alt="Logo" className="welcome-logo" />
          <div className="welcome-text">
            <h1>¡Hola, <span className="text-sky">{user?.name}</span>!</h1>
            <p>Bienvenido al Centro de Alto Rendimiento Escuelita Lo Miranda FC.</p>
          </div>
        </div>
        <div className="role-tag">{user?.role?.toUpperCase() || 'USUARIO'}</div>
      </div>

      <div className="stats-row">
        {renderStats()}
      </div>

      <div className="dashboard-grid">
        {/* Próximo Gran Evento */}
        <div className="event-widget glass">
          <div className="widget-header">
            <h3>Próximo Compromiso</h3>
            <Link to="/dashboard/calendario" className="see-all">Ver todo <ArrowRight size={14} /></Link>
          </div>
          <div className="next-match-card">
            <div className="match-category">{nextEvent?.type === 'match' ? 'PARTIDO OFICIAL' : 'ENTRENAMIENTO'}</div>
            <div className="match-teams">
              <div className="team">
                <img src={logo} alt="Lo Miranda" />
                <span>LO MIRANDA</span>
              </div>
              <div className="vs">VS</div>
              <div className="team">
                <div className="placeholder-logo">?</div>
                <span>RIVAL</span>
              </div>
            </div>
            <div className="match-info">
              <span>{nextEvent?.date}</span>
              <span>{nextEvent?.time}</span>
              <span>{nextEvent?.location}</span>
            </div>
          </div>
        </div>

        {/* Notificaciones / Actividad */}
        <div className="activity-widget glass">
          <div className="widget-header">
            <h3>Actividad Reciente</h3>
          </div>
          <div className="activity-list">
            <ActivityItem text="Nuevas tácticas publicadas por el DT" time="Hace 2 horas" />
            <ActivityItem text="Reporte financiero de Marzo listo" time="Hace 5 horas" />
            <ActivityItem text="Nueva categoría Sub-18 creada" time="Ayer" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`stat-card glass border-${color}`}>
    <div className={`stat-icon bg-${color}`}>{icon}</div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  </div>
);

const ActivityItem = ({ text, time }) => (
  <div className="activity-item">
    <div className="activity-dot"></div>
    <div className="activity-content">
      <p>{text}</p>
      <span>{time}</span>
    </div>
  </div>
);

const ParentDashboardView = ({ user }) => {
  const [showAddPupil, setShowAddPupil] = useState(false);
  const [pupils, setPupils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPupil, setNewPupil] = useState({ name: '', rut: '', category: 'sub10' });

  useEffect(() => {
    fetchMyPupils();
  }, [user]);

  const fetchMyPupils = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Obtener perfiles vinculados
      const { data: kids, error: kError } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', user.id);
      
      if (kError) throw kError;

      if (!kids || kids.length === 0) {
        setPupils([]);
        return;
      }

      // 2. Obtener asistencia en una sola consulta (Optimización Performance)
      const kidIds = kids.map(k => k.id);
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('player_id, status')
        .in('player_id', kidIds);

      // 3. Procesar datos (Mapeo eficiente)
      const kidsWithStats = kids.map(k => {
        const myAttendance = (attendanceData || []).filter(a => a.player_id === k.id);
        const total = myAttendance.length;
        const present = myAttendance.filter(a => a.status === 'present' || a.status === 'match').length;
        const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 100;

        return {
          ...k,
          attendance: `${attendancePercent}%`,
          goals: 0, 
          nextMatch: 'Próximo entrenamiento'
        };
      });

      setPupils(kidsWithStats);
    } catch (err) {
      console.error('Error fetching pupils:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPupil = async () => {
    if(!newPupil.name || !newPupil.rut) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if(!validateRUT(newPupil.rut)) {
      setError('El RUT ingresado no es válido (ej: 12345678-9).');
      return;
    }

    setError('');
    try {
      // Intentamos crear el perfil directamente vinculado
      // NOTA: Para un sistema real, esto funcionaría mejor con una búsqueda previa 
      // o un proceso de invitación, pero cumpliendo el flujo del usuario:
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          full_name: newPupil.name.toUpperCase(),
          email: `${cleanRUT(newPupil.rut)}@escuelitalomiranda.cl`, // Placeholder email
          category_id: newPupil.category,
          parent_id: user.id,
          role: 'player'
        }])
        .select();

      if (insertError) throw insertError;

      setShowAddPupil(false);
      setNewPupil({ name: '', rut: '', category: 'sub10' });
      fetchMyPupils(); // Recargar lista
    } catch (err) {
      setError('Error al registrar: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="dashboard-home parent-view">
      <div className="welcome-banner glass">
        <div className="welcome-text-group">
          <img src={logo} alt="Logo" className="welcome-logo" />
          <div className="welcome-text">
            <h1>¡Hola, <span className="text-sky">{user?.name}</span>!</h1>
            <p>Panel de Supervisión de Apoderados.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAddPupil(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} />
          Registrar Pupilo
        </button>
      </div>

      <div className="streaming-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="streaming-icon-wrapper">
            <Tv size={30} />
          </div>
          <div>
            <h3 className="streaming-title">Lo Miranda <span style={{ color: '#ef4444' }}>EN VIVO</span> • <span className="streaming-live-tag">● REC</span></h3>
            <p style={{ margin: '5px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Acompaña a tus pupilos desde la distancia o revive sus mejores jugadas.</p>
          </div>
        </div>
        <Link to="/streaming" className="btn-primary" style={{ background: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
          <Play size={20} fill="currentColor" />
          Ingresar
        </Link>
      </div>

      <div className="widget-header">
        <h2>Mis Pupilos a Cargo</h2>
      </div>

      <div className="pupils-grid">
        {loading ? (
          <p>Cargando información de tus pupilos...</p>
        ) : pupils.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center', gridColumn: '1/-1' }}>
            <Users size={40} className="text-muted" style={{ marginBottom: '15px' }} />
            <h3>No tienes pupilos registrados</h3>
            <p>Haz clic en "Registrar Pupilo" para comenzar.</p>
          </div>
        ) : pupils.map(p => (
          <div key={p.id} className="pupil-card glass">
            <div className="pupil-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="pupil-avatar-wrapper">
                  {p.avatar_url ? <img src={p.avatar_url} alt="Avatar" /> : (p.full_name || '').charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{p.full_name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sky-400)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category_id}</span>
                </div>
              </div>
              <ShieldCheck className="text-muted" size={20} />
            </div>

            <div className="pupil-stats-grid">
              <div className="pupil-stat-box">
                <span className="pupil-stat-label">Asistencia</span>
                <strong className="pupil-stat-value">{p.attendance}</strong>
              </div>
              <div className="pupil-stat-box">
                <span className="pupil-stat-label">Puntos</span>
                <strong className="pupil-stat-value">{p.points || 0}</strong>
              </div>
            </div>

            <div className="pupil-next-match">
              <CalendarIcon size={16} className="text-sky" />
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Próximo Partido</span>
                <strong style={{ color: 'white' }}>{p.nextMatch}</strong>
              </div>
            </div>
            
            <button className="btn-secondary-outline" style={{ width: '100%', marginTop: '15px' }}>Ver Perfil</button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddPupil && (
          <div className="modal-overlay" onClick={() => setShowAddPupil(false)}>
            <motion.div 
              className="modal-content" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Registrar <span className="text-sky">Pupilo</span></h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '25px' }}>Vincula a un nuevo alumno a tu supervisión.</p>
              
              {error && (
                <div className="error-message glass" style={{ color: '#ef4444', padding: '10px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: MATEO MIRANDA"
                  value={newPupil.name}
                  onChange={(e) => setNewPupil({...newPupil, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">RUT / Identificación</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="12345678-9"
                  value={newPupil.rut}
                  onChange={(e) => setNewPupil({...newPupil, rut: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select 
                  className="form-input"
                  value={newPupil.category}
                  onChange={(e) => setNewPupil({...newPupil, category: e.target.value})}
                  style={{ appearance: 'none' }}
                >
                  <option value="sub6">Sub-06</option>
                  <option value="sub8">Sub-08</option>
                  <option value="sub10">Sub-10</option>
                  <option value="sub12">Sub-12</option>
                  <option value="sub14">Sub-14</option>
                  <option value="sub16">Sub-16</option>
                  <option value="adultos">Adultos</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn-secondary-outline" onClick={() => setShowAddPupil(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleRegisterPupil}>Vincular</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;

