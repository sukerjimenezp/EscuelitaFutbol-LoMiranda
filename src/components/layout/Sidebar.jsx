import React, { useState, useRef } from 'react';
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
  Radio,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { showToast } from '../Toast';
import logo from '../../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = ({ isMobileOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { user, logout, updateUserAvatar } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      showToast('Subiendo foto...', 'info');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateUserAvatar(publicUrlData.publicUrl);
      showToast('¡Foto de perfil actualizada!', 'success');
    } catch (err) {
      showToast('Error al actualizar la foto: ' + err.message, 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const menuByRole = {
    superadmin: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
      { path: '/dashboard/usuarios', icon: Users, label: 'Directorio' },
      { path: '/dashboard/perfiles', icon: Users, label: 'Crear Perfiles' },
      { path: '/dashboard/categorias', icon: Trophy, label: 'Categorías' },
      { path: '/dashboard/asistencia', icon: ClipboardList, label: 'Asistencia' },
      { path: '/dashboard/recompensas', icon: Trophy, label: 'Recompensas' },
      { path: '/dashboard/galeria', icon: ImageIcon, label: 'Galería' },
      { path: '/dashboard/el-profe-dice', icon: MessageSquare, label: 'El Profe Dice' },
      { path: '/dashboard/streaming-config', icon: Radio, label: 'En Vivo (Config)' },
      { path: '/dashboard/finanzas', icon: Wallet, label: 'Finanzas' },
      { path: '/dashboard/vouchers', icon: ImageIcon, label: 'Comprobantes' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
      { path: '/dashboard/reportes', icon: FileText, label: 'Reportes' },
      { path: '/dashboard/stats', icon: Target, label: 'Estadísticas' },
    ],
    dt: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
      { path: '/dashboard/usuarios', icon: Users, label: 'Mi Plantilla' },
      { path: '/dashboard/asistencia', icon: ClipboardList, label: 'Pase de Lista' },
      { path: '/dashboard/recompensas', icon: Trophy, label: 'Logros & Skins' },
      { path: '/dashboard/galeria', icon: ImageIcon, label: 'Galería' },
      { path: '/dashboard/el-profe-dice', icon: MessageSquare, label: 'El Profe Dice' },
      { path: '/dashboard/streaming-config', icon: Radio, label: 'En Vivo (Config)' },
      { path: '/dashboard/tacticas', icon: Activity, label: 'Pizarra Táctica' },
      { path: '/dashboard/calendario', icon: Calendar, label: 'Calendario' },
      { path: '/dashboard/stats', icon: Target, label: 'Estadísticas Jugadores' },
    ],
    contador: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Consolidado' },
      { path: '/dashboard/finanzas', icon: Wallet, label: 'Contabilidad' },
      { path: '/dashboard/vouchers', icon: ImageIcon, label: 'Comprobantes' },
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
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      animate={{ 
        width: isCollapsed ? 80 : 260,
        x: isMobileOpen ? 0 : (window.innerWidth < 768 ? -280 : 0)
      }}
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
          className="collapse-btn desktop-only"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <button className="mobile-only close-sidebar-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="sidebar-user glass" style={{ position: 'relative' }}>
        <div 
          className="user-avatar-container" 
          onClick={handleAvatarClick}
          style={{ 
            cursor: 'pointer', 
            position: 'relative',
            opacity: uploadingAvatar ? 0.5 : 1
          }}
          title="Cambiar foto de perfil"
        >
          <img src={user?.avatar_url || user?.avatar} alt={user?.name} className="user-avatar" />
          <div className="avatar-hover-overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s'
          }}>
            <ImageIcon size={16} color="white" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        
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
            onClick={() => { if(window.innerWidth < 768) onClose(); }}
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
