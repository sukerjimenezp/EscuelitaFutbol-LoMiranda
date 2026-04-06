import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/AuthContext';
import { useLive } from '../../data/LiveContext';
import logo from '../../assets/logo.jpg';
import './Navbar.css';

// Live banner se carga de forma segura
const LiveBanner = () => {
  const { isLive } = useLive();
  if (!isLive) return null;
  
  return (
    <div className="live-alert-banner">
      <span className="live-dot"></span>
      <strong>¡EN VIVO AHORA!</strong>
      <span>Escuelita Lo Miranda está transmitiendo en este momento.</span>
      <Link to="/streaming" className="live-alert-btn">Ver Transmisión →</Link>
    </div>
  );
};

const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      <LiveBanner />

      <nav className="navbar glass">
        <Link to="/" className="logo-container" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="Logo" className="nav-logo" />
          <span className="logo-text">
            ESCUELITA <span className="text-sky text-glow">LO MIRANDA</span>
            <small className="est-year">EST. 2003</small>
          </span>
        </Link>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span></span><span></span><span></span>
        </button>

        {/* Links */}
        <ul className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Inicio</Link></li>
          <li><Link to="/categorias" className={location.pathname.includes('/categorias') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Categorías</Link></li>
          <li><Link to="/galeria" className={location.pathname === '/galeria' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Galería</Link></li>
          <li><Link to="/streaming" className={location.pathname === '/streaming' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Streaming</Link></li>

          {isAuthenticated ? (
            <>
              <li><Link to="/dashboard" className={location.pathname.startsWith('/dashboard') ? 'active' : ''} onClick={() => setMenuOpen(false)}>📋 Dashboard</Link></li>
              <li><button onClick={handleLogout} className="btn-logout">Salir</button></li>
            </>
          ) : (
            <li className="admin-link"><Link to="/login" onClick={() => setMenuOpen(false)}>Ingresar</Link></li>
          )}
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
