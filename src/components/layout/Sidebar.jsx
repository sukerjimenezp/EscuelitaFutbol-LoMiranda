import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar, 
  Wallet, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  CreditCard,
  ClipboardList,
  FileText,
  Target,
  MessageSquare,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../data/AuthContext';
import logo from '../../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuByRole = {
    superadmin: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
      { path: '/dashboard/usuarios', icon: Users, label: 'Directorio' },
      { path: '/dashboard/categorias', icon: Trophy, label: 'Categorías' },
      { path: '/dashboard/recompensas', icon: Trophy, label: 'Recompensas' },
      { path: '/dashboard/el-profe-dice', icon: MessageSquare, label: 'El Profe Dice' },
      { path: '/dashboard/streaming-config', icon: Radio, label: 'En Vivo (Config)' },
      { path: '/dashboard/finanzas', icon: Wallet, label: 'Finanzas' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
      { path: '/dashboard/stats', icon: Target, label: 'Estadísticas' },
    ],
    dt: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
      { path: '/dashboard/usuarios', icon: Users, label: 'Mi Plantilla' },
      { path: '/dashboard/asistencia', icon: ClipboardList, label: 'Pase de Lista' },
      { path: '/dashboard/recompensas', icon: Trophy, label: 'Logros & Skins' },
      { path: '/dashboard/el-profe-dice', icon: MessageSquare, label: 'El Profe Dice' },
      { path: '/dashboard/streaming-config', icon: Radio, label: 'En Vivo (Config)' },
      { path: '/dashboard/tacticas', icon: Activity, label: 'Pizarra Táctica' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
      { path: '/dashboard/stats', icon: Target, label: 'Estadísticas Jugadores' },
    ],
    contador: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Consolidado' },
      { path: '/dashboard/finanzas', icon: Wallet, label: 'Contabilidad' },
      { path: '/dashboard/reportes', icon: FileText, label: 'Reportes PDF' },
    ],
    parent: [
      { path: '/dashboard', icon: Users, label: 'Mis Pupilos' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
      { path: '/dashboard/stats', icon: Target, label: 'Rendimiento' },
    ],
    player: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Mi Perfil' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Entrenamientos' },
      { path: '/dashboard/stats', icon: Target, label: 'Mis Estadísticas' },
    ]
  };

  const menuItems = menuByRole[user?.role] || [];

  return (
    <motion.aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-header">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              className="logo-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <img src={logo} alt="Lo Miranda FC" className="logo-small" />
              <span className="logo-text">LO MIRANDA</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="sidebar-user glass">
        <img src={user?.avatar} alt={user?.name} className="user-avatar" />
        {!isCollapsed && (
          <div className="user-meta">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} className="nav-icon" />
          {!isCollapsed && <span className="nav-label">Cerrar Sesión</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
