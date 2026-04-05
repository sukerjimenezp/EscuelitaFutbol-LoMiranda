import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import './Gallery.css';

const Gallery = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  const isAdmin = user?.role === 'superadmin' || user?.role === 'dt';

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url, type: file.type.startsWith('video') ? 'video' : 'image' });
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    const ext = preview.file.name.split('.').pop();
    const path = `gallery/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, preview.file, { upsert: true });

    if (uploadError) {
      alert('Error al subir el archivo: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    await supabase.from('gallery').insert({
      url: urlData.publicUrl,
      caption: caption,
      type: preview.type,
      uploaded_by: user.id,
    });

    setPreview(null);
    setCaption('');
    fileRef.current.value = '';
    fetchGallery();
    setUploading(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('¿Eliminar este elemento de la galería?')) return;
    const path = item.url.split('/media/')[1];
    await supabase.storage.from('media').remove([path]);
    await supabase.from('gallery').delete().eq('id', item.id);
    fetchGallery();
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div>
          <h1>📸 Galería <span className="text-sky">Multimedia</span></h1>
          <p className="gallery-subtitle">Fotos y videos del club</p>
        </div>
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

      {isAdmin && (
        <div className="gallery-upload glass">
          <h3>⬆️ Subir contenido</h3>
          <div className="upload-zone" onClick={() => fileRef.current.click()}>
            {preview ? (
              preview.type === 'image' ? (
                <img src={preview.url} alt="preview" className="upload-preview-img" />
              ) : (
                <video src={preview.url} className="upload-preview-img" controls />
              )
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📁</span>
                <span>Haz clic para seleccionar una foto o video</span>
                <small>JPG, PNG, MP4, MOV (máx. 50MB)</small>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          {preview && (
            <div className="upload-meta">
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="upload-caption-input"
              />
              <div className="upload-actions">
                <button className="btn-cancel" onClick={() => { setPreview(null); setCaption(''); fileRef.current.value = ''; }}>
                  ✕ Cancelar
                </button>
                <button className="btn-upload" onClick={handleUpload} disabled={uploading}>
                  {uploading ? '⏳ Subiendo...' : '✅ Publicar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="gallery-loading">
          <div className="spinner"></div>
          <p>Cargando galería...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gallery-empty glass">
          <span>📷</span>
          <p>No hay contenido aún. {isAdmin ? '¡Sé el primero en subir algo!' : 'Vuelve pronto.'}</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map(item => (
            <div key={item.id} className="gallery-item" onClick={() => setLightbox(item)}>
              {item.type === 'video' ? (
                <video src={item.url} className="gallery-media" muted />
              ) : (
                <img src={item.url} alt={item.caption || 'Galería'} className="gallery-media" loading="lazy" />
              )}
              <div className="gallery-overlay">
                {item.type === 'video' && <span className="video-badge">▶ Video</span>}
                {item.caption && <p className="gallery-caption">{item.caption}</p>}
                {isAdmin && (
                  <button className="btn-delete-gallery" onClick={e => { e.stopPropagation(); handleDelete(item); }}>
                    🗑️
                  </button>
                )}
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
    </div>
  );
};

export default Gallery;
