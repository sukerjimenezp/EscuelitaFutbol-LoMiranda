import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Categories.css';

const categoryIcons = {
  sub6: '⚽', sub8: '🌟', sub10: '🔥', sub12: '💪', sub14: '🎯', sub16: '🏆', adultos: '👑'
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [playersCounts, setPlayersCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (catError) throw catError;

      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('category_id, role')
        .eq('role', 'player');
      
      if (profError) throw profError;

      const counts = {};
      
      if (catData) {
        catData.forEach(c => counts[c.id] = 0);
      }
      
      if (profiles) {
        profiles.forEach(p => {
          if (p.category_id && counts[p.category_id] !== undefined) {
            counts[p.category_id]++;
          }
        });
      }

      setCategories(catData || []);
      setPlayersCounts(counts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="categories-page">
      <div className="section-header">
        <h1 className="section-title">Nuestras <span className="text-sky">Categorías</span></h1>
        <p className="section-subtitle">FÚTBOL AMATEUR • FORMACIÓN INTEGRAL</p>
        <div className="section-line"></div>
      </div>

      <div className="categories-grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', width: '100%', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            Cargando categorías...
          </div>
        ) : (
          categories.map((cat) => {
            const playersCount = playersCounts[cat.id] || 0;
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
                    <span className="cat-age-badge">{cat.age_range}</span>
                  </div>
                  <h2 className="cat-name">{cat.name}</h2>
                  <div className="cat-bottom-row">
                    <div className="cat-stat">
                      <Users size={14} />
                      <span>{playersCount} jugadores</span>
                    </div>
                    <div className="cat-cta">
                      Ver plantilla <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Categories;
