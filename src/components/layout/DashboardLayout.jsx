import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../data/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Cargar notificaciones reales (Próximos eventos)
  useEffect(() => {
    const fetchRealNotifications = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5);
        
        if (data) {
          setNotifications(data.map(ev => ({
            id: ev.id,
            title: ev.type === 'match' ? '⚽ Próximo Partido' : '🏃 Entrenamiento',
            desc: ev.title,
            time: ev.date
          })));
        }
      } catch (err) {
        console.warn('Error cargando notificaciones:', err);
      }
    };
    fetchRealNotifications();
  }, []);

  // Obtener el nombre de la página basado en la ruta
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'dashboard') return 'Resumen General';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Ref para detectar clics fuera del dropdown de notificaciones
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <div className={`dashboard-layout ${isDarkMode ? 'dark' : 'light'} ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      <Sidebar isMobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Overlay para cerrar en móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="main-wrapper">
        <header className="dashboard-header glass">
          <div className="header-left">
            <button className="mobile-toggle-btn" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>
            <div className="breadcrumb">
              <span className="text-muted">Panel</span>
              <ChevronRight size={14} className="text-muted" />
              <span className="current-page">{getPageTitle()}</span>
            </div>
          </div>

          <div className="header-right">
            <div className="search-bar glass">
              <Search size={18} className="text-muted" />
              <input type="text" placeholder="Buscar jugadores, eventos..." />
            </div>

            <div className="header-actions">
              <button 
                className="action-btn glass" 
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="notification-wrapper" ref={notifRef}>
                <button 
                  className="action-btn glass"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="notify-badge">{notifications.length}</span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      className="notifications-dropdown glass"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <div className="dropdown-header"> Notificaciones </div>
                      <div className="notification-list">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div key={n.id} className="notif-item">
                              <strong>{n.title}</strong>
                              <p>{n.desc}</p>
                              <small>{n.time}</small>
                            </div>
                          ))
                        ) : (
                          <div className="notif-empty">
                            <p>No tienes notificaciones pendientes</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="header-user">
                <img src={user?.avatar_url || user?.avatar} alt={user?.name} />
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-view">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
