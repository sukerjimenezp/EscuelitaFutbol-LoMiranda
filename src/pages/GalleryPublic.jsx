import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './GalleryPublic.css';

const GalleryPublic = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    loadMore(true);
  }, [filter]);

  const loadMore = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter !== 'all') query = query.eq('type', filter);

    const { data } = await query;
    const newItems = data || [];

    setItems(prev => reset ? newItems : [...prev, ...newItems]);
    setHasMore(newItems.length === PAGE_SIZE);
    setPage(currentPage + 1);
    setLoading(false);
  };

  const filtered = items;

  return (
    <section className="gallery-public-page">
      <div className="gallery-pub-header">
        <small className="section-label">Club Escuelita Lo Miranda</small>
        <h2>Nuestra <span className="text-sky">Galería</span></h2>
        <p>Momentos especiales dentro y fuera de la cancha</p>
        <div className="gallery-filters">
          {[['all', '🏅 Todo'], ['image', '🖼️ Fotos'], ['video', '🎬 Videos']].map(([f, label]) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => { setLoading(true); setFilter(f); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="gallery-loading"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="gallery-empty-pub glass">
          <span>📷</span>
          <p>Próximamente compartiremos los mejores momentos del club.</p>
        </div>
      ) : (
        <>
          <div className="masonry-pub-grid">
            {filtered.map(item => (
              <div key={item.id} className="masonry-pub-item" onClick={() => setLightbox(item)}>
                {item.youtube_id ? (
                  <>
                    <img
                      src={`https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`}
                      alt={item.caption || 'Video'}
                      className="masonry-pub-media"
                      loading="lazy"
                    />
                    <div className="yt-play-overlay"><span>▶</span></div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || 'Galería'}
                    className="masonry-pub-media"
                    loading="lazy"
                  />
                )}
                {item.caption && (
                  <div className="masonry-pub-caption-bar">
                    <p>{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn-load-more" onClick={() => loadMore(false)} disabled={loading}>
                {loading ? '⏳ Cargando...' : '⬇ Ver más'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            {lightbox.youtube_id ? (
              <iframe
                src={`https://www.youtube.com/embed/${lightbox.youtube_id}?autoplay=1`}
                className="lightbox-yt"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={lightbox.caption || 'Video'}
              />
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
