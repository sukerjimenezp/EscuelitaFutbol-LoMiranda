import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Trophy } from 'lucide-react';
import { categories, playersByCategory } from '../data/mockData';
import './Categories.css';

const categoryIcons = {
  sub6: '⚽', sub8: '🌟', sub10: '🔥', sub12: '💪', sub14: '🎯', sub16: '🏆', adultos: '👑'
};

const Categories = () => {
  return (
    <div className="categories-page">
      <div className="section-header">
        <h1 className="section-title">Nuestras <span className="text-sky">Categorías</span></h1>
        <p className="section-subtitle">FÚTBOL AMATEUR • FORMACIÓN INTEGRAL</p>
        <div className="section-line"></div>
      </div>

      <div className="categories-grid">
        {categories.map((cat, index) => {
          const players = playersByCategory[cat.id] || [];
          const icon = categoryIcons[cat.id] || '⚽';
          return (
            <Link to={`/categorias/${cat.id}`} key={cat.id} className="category-card glass">
              <div className="cat-color-accent" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}88)` }}></div>
              <div className="cat-icon-badge" style={{ background: `${cat.color}20`, borderColor: `${cat.color}40` }}>
                <span>{icon}</span>
              </div>
              <div className="cat-content">
                <div className="cat-top-row">
                  <span className="cat-label">{cat.label}</span>
                  <span className="cat-age-badge">{cat.ageRange}</span>
                </div>
                <h2 className="cat-name">{cat.name}</h2>
                <div className="cat-bottom-row">
                  <div className="cat-stat">
                    <Users size={14} />
                    <span>{players.length} jugadores</span>
                  </div>
                  <div className="cat-cta">
                    Ver plantilla <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
