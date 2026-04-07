import React, { useState } from 'react';
import { useAuth } from '../data/AuthContext';
import { playersByCategory, events, finances } from '../data/mockData';
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Trophy, 
  Activity,
  ArrowRight,
  UserPlus,
  Settings,
  ShieldCheck,
  Tv,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.jpg';
import './Dashboard.css';

import PlayerProfile from './dashboard/PlayerProfile';

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
  const [pupils, setPupils] = useState([
    { id: 1, name: 'Mateo López', category: 'Sub-12', attendance: '95%', goals: 4, nextMatch: 'Sábado 10:00 AM' }
  ]);

  const [newPupil, setNewPupil] = useState({ name: '', rut: '', category: 'Sub-10' });

  const handleRegisterPupil = () => {
    if(!newPupil.name) return;
    setPupils([...pupils, { 
      id: Date.now(), 
      name: newPupil.name, 
      category: newPupil.category, 
      attendance: '100%', 
      goals: 0, 
      nextMatch: 'Por definir' 
    }]);
    setShowAddPupil(false);
    setNewPupil({ name: '', rut: '', category: 'Sub-10' });
  };

  return (
    <div className="dashboard-home parent-view">
      <div className="welcome-banner glass" style={{ marginBottom: '30px' }}>
        <div className="welcome-text-group">
          <img src={logo} alt="Logo" className="welcome-logo" />
          <div className="welcome-text">
            <h1>¡Hola, <span className="text-sky">{user?.name}</span>!</h1>
            <p>Panel de Supervición de Apoderados.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAddPupil(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} />
          Registrar Pupilo
        </button>
      </div>

      <div className="streaming-banner glass" style={{ marginBottom: '30px', padding: '25px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '50%', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={30} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>Lo Miranda <span style={{ color: '#ef4444' }}>EN VIVO</span> • <span style={{ fontSize: '1rem', color: '#f87171', animation: 'pulse 2s infinite' }}>● REC</span></h3>
            <p style={{ margin: '5px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Acompaña a tus pupilos desde la distancia o revive sus mejores jugadas.</p>
          </div>
        </div>
        <Link to="/streaming" className="btn-primary" style={{ background: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
          <Play size={20} fill="currentColor" />
          Ingresar a la Transmisión
        </Link>
      </div>

      <div className="widget-header" style={{ marginBottom: '20px' }}>
        <h2>Mis Pupilos a Cargo</h2>
      </div>

      <div className="pupils-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {pupils.map(p => (
          <div key={p.id} className="pupil-card glass" style={{ padding: '24px', borderRadius: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sky-400), var(--sky-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>{p.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--sky-400)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</span>
                </div>
              </div>
              <ShieldCheck className="text-muted" size={20} />
            </div>

            <div className="pupil-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Asistencia</span>
                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{p.attendance}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Goles</span>
                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{p.goals}</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={16} className="text-sky" />
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Próximo Partido</span>
                <strong style={{ color: 'white' }}>{p.nextMatch}</strong>
              </div>
            </div>
            
            <button className="btn-secondary-outline" style={{ width: '100%', marginTop: '15px' }}>Ver Perfil Completo</button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddPupil && (
          <div className="modal-overlay" onClick={() => setShowAddPupil(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              className="event-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '400px', padding: '30px', background: 'var(--bg-surface)', borderRadius: '24px' }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Registrar <span className="text-sky">Pupilo</span></h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Ingresa los datos del alumno para vincularlo a tu cuenta de apoderado.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nombre Completo del Niño(a)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Mateo López"
                    value={newPupil.name}
                    onChange={(e) => setNewPupil({...newPupil, name: e.target.value})}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>RUT / Identificación</label>
                  <input 
                    type="text" 
                    placeholder="Sin puntos ni guiones"
                    value={newPupil.rut}
                    onChange={(e) => setNewPupil({...newPupil, rut: e.target.value})}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Categoría (Serie)</label>
                  <select 
                    value={newPupil.category}
                    onChange={(e) => setNewPupil({...newPupil, category: e.target.value})}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '1rem' }}
                  >
                    <option style={{background: '#0f172a', color: 'white'}} value="Sub-10">Sub-10</option>
                    <option style={{background: '#0f172a', color: 'white'}} value="Sub-12">Sub-12</option>
                    <option style={{background: '#0f172a', color: 'white'}} value="Sub-14">Sub-14</option>
                    <option style={{background: '#0f172a', color: 'white'}} value="Sub-16">Sub-16</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary-outline" onClick={() => setShowAddPupil(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleRegisterPupil}>Vincular Pupilo</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
