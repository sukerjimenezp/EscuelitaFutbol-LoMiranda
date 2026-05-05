import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PlayerCard from '../components/PlayerCard';
import './TeamPage.css';

const TeamPage = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [teamStaff, setTeamStaff] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, [categoryId]);

  const fetchTeamData = async () => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      
      if (catData) setCategory(catData);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('category_id', categoryId);
      
      if (profiles) {
        const dts = profiles.filter(p => p.role === 'dt').map(p => ({
          id: p.id,
          name: p.full_name || 'Profesor',
          role: 'Director Técnico',
          image: p.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.full_name || 'Profesor')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16,short17,short18,short19&earringsProbability=0`
        }));
        setTeamStaff(dts);

        const roster = profiles.filter(p => p.role === 'player').map(p => ({
          id: p.id,
          name: p.full_name || 'Jugador',
          position: p.position || 'MED',
          overall: p.overall || 75,
          pace: p.pace || 75,
          shooting: p.shooting || 75,
          passing: p.passing || 75,
          dribbling: p.dribbling || 75,
          defense: p.defense || 75,
          physical: p.physical || 75,
          image: p.avatar_url
        }));
        setPlayers(roster);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="team-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando plantilla...</p>
      </div>
    );
  }

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
          <span className="team-badge-age">{category.age_range}</span>
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
