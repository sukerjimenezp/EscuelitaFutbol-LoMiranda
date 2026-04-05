import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/AuthContext';
import logo from '../../assets/logo.jpg';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass">
      <Link to="/" className="logo-container">
        <img src={logo} alt="Logo" className="nav-logo" />
        <span className="logo-text">
          ESCUELITA <span className="text-sky text-glow">LO MIRANDA</span>
          <small className="est-year">EST. 2003</small>
        </span>
      </Link>
      <ul className="nav-links">
        <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Inicio</Link></li>
        <li><Link to="/categorias" className={location.pathname.includes('/categorias') ? 'active' : ''}>Categorías</Link></li>
        <li><Link to="/galeria" className={location.pathname === '/galeria' ? 'active' : ''}>Galería</Link></li>
        <li><Link to="/streaming" className={location.pathname === '/streaming' ? 'active' : ''}>Streaming</Link></li>

        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>📋 Dashboard</Link></li>
            <li className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role === 'dt' ? 'DT' : user.role === 'admin' ? 'Admin' : 'Apoderado'}</span>
            </li>
            <li><button onClick={handleLogout} className="btn-logout">Salir</button></li>
          </>
        ) : (
          <li className="admin-link"><Link to="/login">Ingresar</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
