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
import { useSkins } from '../../data/SkinsContext';
import { supabase } from '../../lib/supabase';
import { showToast } from '../Toast';
import logo from '../../assets/logo.jpg';
import './Sidebar.css';

const Sidebar = ({ isMobileOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const { user, logout, updateUserAvatar } = useAuth();
  const { skins } = useSkins();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
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
      { path: '/dashboard/apoderados', icon: Users, label: 'Apoderados' },
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
      { path: '/dashboard/usuarios', icon: Users, label: 'Directorio' },
      { path: '/dashboard/apoderados', icon: Users, label: 'Apoderados' },
      { path: '/dashboard/categorias', icon: Trophy, label: 'Categorías' },
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

      <AnimatePresence>
        {showAvatarModal && (
          <div className="modal-overlay" onClick={() => setShowAvatarModal(false)} style={{ zIndex: 100000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              className="modal-content glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '500px', maxWidth: '90vw', padding: '30px', borderRadius: '24px', background: 'var(--bg-surface)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Elige tu <span className="text-sky">Avatar</span></h2>
                <button onClick={() => setShowAvatarModal(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><X size={20}/></button>
              </div>
              
              {user?.role === 'player' ? (
                 <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                   <Trophy size={40} className="text-yellow" style={{ marginBottom: '15px' }} />
                   <h3>¡Armario Bloqueado!</h3>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '10px 0 20px' }}>
                     Como jugador, debes desbloquear tus skins y logos utilizando los puntos que ganes en tus entrenamientos.
                   </p>
                   <button className="btn-primary" onClick={() => { setShowAvatarModal(false); navigate('/dashboard'); }} style={{ width: '100%' }}>
                     Ir a Mi Perfil
                   </button>
                 </div>
              ) : (
                 <>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>Selecciona uno de los logos oficiales o skins del sistema:</p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '15px', maxHeight: '300px', overflowY: 'auto', padding: '10px 5px', alignItems: 'start' }}>
                     {skins && skins.length > 0 ? skins.map(skin => (
                       <div 
                         key={skin.id}
                         onClick={async () => {
                           await updateUserAvatar(skin.image_url);
                           showToast('Avatar actualizado', 'success');
                           setShowAvatarModal(false);
                         }}
                         style={{ 
                           aspectRatio: '1', 
                           borderRadius: '15px', 
                           overflow: 'hidden', 
                           cursor: 'pointer', 
                           border: user?.avatar_url === skin.image_url ? '3px solid var(--sky-400)' : '2px solid rgba(255,255,255,0.1)', 
                           background: 'rgba(255,255,255,0.05)',
                           transition: 'all 0.2s ease',
                           transform: user?.avatar_url === skin.image_url ? 'scale(1.05)' : 'scale(1)'
                         }}
                         title={skin.name}
                       >
                         <img src={skin.image_url} alt={skin.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       </div>
                     )) : (
                       <p style={{ color: 'var(--text-muted)' }}>No hay skins disponibles aún.</p>
                     )}
                   </div>
                 </>
              )}

              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <button className="btn-secondary-outline" onClick={() => setShowAvatarModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={() => { setShowAvatarModal(false); if(fileInputRef.current) fileInputRef.current.click(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={16} />
                  {uploadingAvatar ? 'Subiendo...' : 'Subir desde PC'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default Sidebar;
