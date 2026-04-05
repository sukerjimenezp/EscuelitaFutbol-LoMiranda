import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './GalleryPublic.css';

const GalleryPublic = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <section className="gallery-public-page">
      <div className="gallery-pub-header">
        <small className="section-label">Club Escuelita Lo Miranda</small>
        <h2>Nuestra <span className="text-sky">Galería</span></h2>
        <p>Momentos especiales dentro y fuera de la cancha</p>
        <div className="gallery-filters">
          {['all', 'image', 'video'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '🏅 Todo' : f === 'image' ? '🖼️ Fotos' : '🎬 Videos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="gallery-loading">
          <div className="spinner"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gallery-empty-pub glass">
          <span>📷</span>
          <p>Próximamente compartiremos los mejores momentos del club.</p>
        </div>
      ) : (
        <div className="gallery-pub-grid">
          {filtered.map(item => (
            <div key={item.id} className="gallery-pub-item" onClick={() => setLightbox(item)}>
              {item.type === 'video' ? (
                <video src={item.url} className="gallery-pub-media" muted />
              ) : (
                <img src={item.url} alt={item.caption || 'Galería'} className="gallery-pub-media" loading="lazy" />
              )}
              <div className="gallery-pub-overlay">
                {item.type === 'video' && <span className="video-badge">▶</span>}
                {item.caption && <p className="gallery-pub-caption">{item.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            {lightbox.type === 'video' ? (
              <video src={lightbox.url} controls autoPlay className="lightbox-media" />
            ) : (
              <img src={lightbox.url} alt={lightbox.caption} className="lightbox-media" />
            )}
            {lightbox.caption && <p className="lightbox-caption">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </section>
  );
};

export default GalleryPublic;
