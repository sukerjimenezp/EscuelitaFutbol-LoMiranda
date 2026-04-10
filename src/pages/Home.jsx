import React from 'react';
import { Link } from 'react-router-dom';
import { useLive } from '../data/LiveContext';
import './Home.css';

const Home = () => {
  const { isLive } = useLive();

  return (
    <>
      {/* Live Alert Bar */}
      {isLive && (
        <div className="home-live-notice">
          <span className="live-badge-mini">LIVE</span>
          <span>¡Estamos transmitiendo un partido en vivo en este momento!</span>
          <Link to="/streaming" className="home-live-link">Unirse ahora</Link>
        </div>
      )}

      {/* Hero */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="badge-exclusive">ESCUELA DE FÚTBOL • LO MIRANDA</div>
          <h1 className="hero-title">
            Forjando<br/><span className="text-sky text-glow">Leyendas</span>
          </h1>
          <p className="hero-subtitle">
            Más de 20 años formando futbolistas con pasión, disciplina y el sueño de llegar lejos. Bienvenido a la cancha.
          </p>
          <div className="hero-actions">
            <Link to="/categorias" className="btn-primary">⚽ Ver Categorías</Link>
            <Link to="/streaming" className={`btn-secondary ${isLive ? 'pulse-live' : ''}`}>
              {isLive ? '🔴 VER EN VIVO' : '📺 Streaming'}
            </Link>
          </div>
        </div>
      </header>


      {/* Kit Promo Banner */}
      <section className="kit-promo glass">
        <div className="kit-promo-content">
          <div className="kit-label">Nueva Temporada</div>
          <h2 className="kit-title">Conoce Nuestra <span className="text-sky">Nueva Indumentaria</span></h2>
          <p className="kit-description">
            La nueva camiseta del equipo infantil ya está aquí. Diseño exclusivo en azul y rosa que representa la fuerza y la pasión de nuestra cantera.
          </p>
          <Link to="/categorias/sub10" className="btn-kit">Ver Equipo Infantil →</Link>
        </div>
        <div className="kit-promo-image">
          <img src="/kit-banner.png" alt="Nueva Indumentaria 2026 - Escuelita Lo Miranda" />
        </div>
      </section>

      {/* Quick Features */}
      <section className="features-grid">
        <Link to="/streaming" className="feature-card glass feature-link">
          <div className="feature-icon">📡</div>
          <h3>Streaming en Vivo</h3>
          <p>Transmite los partidos para los padres que no pueden asistir a la cancha.</p>
        </Link>
        <Link to="/categorias" className="feature-card glass feature-link">
          <div className="feature-icon">⚽</div>
          <h3>Categorías</h3>
          <p>Desde Sub-6 hasta Adultos. Cada categoría con su plantilla y cuerpo técnico.</p>
        </Link>
        <Link to="/galeria" className="feature-card glass feature-link">
          <div className="feature-icon">📸</div>
          <h3>Galería</h3>
          <p>Fotos y videos de los mejores momentos del club dentro y fuera de la cancha.</p>
        </Link>
      </section>

      {/* Sponsors Section */}
      <section className="sponsors-section glass">
        <div className="sponsors-header">
          <small className="section-label">Partners Oficiales</small>
          <h2>Nuestros <span className="text-sky">Auspiciadores</span></h2>
        </div>
        <div className="sponsors-grid">
          <a href="https://guett.cl/" target="_blank" rel="noopener noreferrer" className="sponsor-card">
            <img 
              src="https://guett.cl/wp-content/uploads/2018/11/CC-Isotipo-Tricolor.png" 
              alt="Guett" 
              className="sponsor-logo" 
            />
            <span>Guett Sports</span>
          </a>
          <a href="https://www.fatheprint.cl" target="_blank" rel="noopener noreferrer" className="sponsor-card">
            <img 
              src="https://www.fatheprint.cl/images/238%2C1600x531%2B0%2B471/18488412/fatheprint-wn0pfgJEhRDGzPLz5mYcDQ.jpeg" 
              alt="Fatheprint" 
              className="sponsor-logo" 
            />
            <span>Fathe Print</span>
          </a>
        </div>
      </section>
    </>
  );
};

export default Home;
