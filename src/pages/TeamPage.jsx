import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { categories, staff, playersByCategory } from '../data/mockData';
import PlayerCard from '../components/PlayerCard';
import './TeamPage.css';

const TeamPage = () => {
  const { categoryId } = useParams();
  const category = categories.find(c => c.id === categoryId);
  const teamStaff = staff[categoryId] || [];
  const players = playersByCategory[categoryId] || [];

  if (!category) {
    return (
      <div className="team-page">
        <div className="section-header">
          <h1 className="section-title">Categoría no encontrada</h1>
          <Link to="/categorias" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>← Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <Link to="/categorias" className="back-link">← Categorías</Link>
        <div className="team-badge" style={{ borderColor: category.color }}>
          <span className="team-badge-name">{category.name}</span>
          <span className="team-badge-label" style={{ color: category.color }}>{category.label}</span>
          <span className="team-badge-age">{category.ageRange}</span>
        </div>
      </div>

      {/* Cuerpo Técnico (DTs) */}
      {teamStaff.length > 0 && (
        <section className="staff-section">
          <h2 className="subsection-title">Cuerpo <span className="text-sky">Técnico</span></h2>
          <div className="staff-grid">
            {teamStaff.map(person => (
              <div key={person.id} className="staff-card glass">
                <img src={person.image} alt={person.name} className="staff-avatar" />
                <div className="staff-info">
                  <h3>{person.name}</h3>
                  <span className="staff-role">{person.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plantilla */}
      <section className="roster-section">
        <div className="section-header">
          <h2 className="section-title">Plantilla <span style={{ color: category.color }}>{category.name}</span></h2>
          <p className="section-subtitle">TEMPORADA 2026 • {players.length} JUGADORES</p>
          <div className="section-line" style={{ background: `linear-gradient(90deg, ${category.color}, var(--sky-400))` }}></div>
        </div>

        {players.length > 0 ? (
          <div className="players-grid">
            {players.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="empty-roster">
            <p>⚽ Aún no hay jugadores registrados en esta categoría.</p>
            <p className="empty-hint">Los jugadores serán agregados por el DT desde el panel administrativo.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamPage;
