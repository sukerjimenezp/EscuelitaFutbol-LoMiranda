import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import './Gallery.css';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const Gallery = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('photo'); // 'photo' | 'youtube'
  const [preview, setPreview] = useState(null);
  const [ytUrl, setYtUrl] = useState('');
  const [ytPreviewId, setYtPreviewId] = useState(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef();

  const isAdmin = user?.role === 'superadmin' || user?.role === 'dt';

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  // ── FOTO ──
  const handleFileChange = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFileError(`La imagen es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). El límite es 2 MB.`);
      return;
    }
    setPreview({ file, url: URL.createObjectURL(file) });
  };

  const handlePhotoUpload = async () => {
    if (!preview) return;
    setUploading(true);
    const ext = preview.file.name.split('.').pop();
    const path = `gallery/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('Galery')
      .upload(path, preview.file, { upsert: true, contentType: preview.file.type });

    if (uploadError) {
      alert('Error al subir: ' + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('Galery').getPublicUrl(path);
    await supabase.from('gallery').insert({
      url: urlData.publicUrl,
      caption,
      type: 'image',
      uploaded_by: user.id,
    });
    resetForm();
    fetchGallery();
    setUploading(false);
  };

  // ── YOUTUBE ──
  const handleYtUrlChange = (e) => {
    const val = e.target.value;
    setYtUrl(val);
    setYtPreviewId(extractYouTubeId(val));
  };

  const handleYouTubeAdd = async () => {
    if (!ytPreviewId) return;
    setUploading(true);
    await supabase.from('gallery').insert({
      url: `https://www.youtube.com/watch?v=${ytPreviewId}`,
      youtube_id: ytPreviewId,
      caption,
      type: 'video',
      uploaded_by: user.id,
    });
    resetForm();
    fetchGallery();
    setUploading(false);
  };

  const resetForm = () => {
    setPreview(null);
    setCaption('');
    setYtUrl('');
    setYtPreviewId(null);
    setFileError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── DELETE ──
  const handleDelete = async (item) => {
    if (!window.confirm('¿Eliminar este elemento?')) return;
    if (item.type === 'image') {
      const path = item.url.split('/Galery/')[1];
      if (path) await supabase.storage.from('Galery').remove([path]);
    }
    await supabase.from('gallery').delete().eq('id', item.id);
    fetchGallery();
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <div className="gallery-page">
      {/* Header */}
      <div className="gallery-header">
        <div>
          <h1>📸 Galería <span className="text-sky">Multimedia</span></h1>
          <p className="gallery-subtitle">{items.length} elemento{items.length !== 1 ? 's' : ''} publicado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="gallery-filters">
          {[['all', '🏅 Todo'], ['image', '🖼️ Fotos'], ['video', '🎬 Videos']].map(([f, label]) => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Panel (Admins only) */}
      {isAdmin && (
        <div className="gallery-upload glass">
          <div className="upload-tabs">
            <button className={`upload-tab ${tab === 'photo' ? 'active' : ''}`} onClick={() => { setTab('photo'); resetForm(); }}>
              📷 Subir Foto
            </button>
            <button className={`upload-tab ${tab === 'youtube' ? 'active' : ''}`} onClick={() => { setTab('youtube'); resetForm(); }}>
              🎬 Enlazar YouTube
            </button>
          </div>

          {tab === 'photo' ? (
            <>
              <div className="upload-zone" onClick={() => fileRef.current.click()}>
                {preview ? (
                  <img src={preview.url} alt="preview" className="upload-preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">🖼️</span>
                    <span>Haz clic para seleccionar una imagen</span>
                    <small>JPG, PNG, WEBP · Máximo <strong>2 MB</strong></small>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }} onChange={handleFileChange} />
              </div>
              {fileError && <p className="upload-error">⚠ {fileError}</p>}
            </>
          ) : (
            <div className="yt-input-zone">
              <div className="yt-input-row">
                <span className="yt-icon">▶</span>
                <input
                  type="text"
                  placeholder="Pega la URL del video de YouTube..."
                  value={ytUrl}
                  onChange={handleYtUrlChange}
                  className="yt-url-input"
                />
              </div>
              {ytPreviewId && (
                <div className="yt-preview">
                  <img
                    src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`}
                    alt="YouTube preview"
                    className="yt-thumb"
                  />
                  <div className="yt-play-badge">▶</div>
                  <p className="yt-preview-label">✅ Video detectado</p>
                </div>
              )}
              {ytUrl && !ytPreviewId && (
                <p className="upload-error">⚠ No se detectó un video de YouTube válido en esa URL.</p>
              )}
            </div>
          )}

          {(preview || ytPreviewId) && (
            <div className="upload-meta">
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="upload-caption-input"
              />
              <div className="upload-actions">
                <button className="btn-cancel" onClick={resetForm}>✕ Cancelar</button>
                <button
                  className="btn-upload"
                  onClick={tab === 'photo' ? handlePhotoUpload : handleYouTubeAdd}
                  disabled={uploading}
                >
                  {uploading ? '⏳ Publicando...' : '✅ Publicar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="gallery-loading"><div className="spinner"></div><p>Cargando galería...</p></div>
      ) : filtered.length === 0 ? (
        <div className="gallery-empty glass">
          <span>📷</span>
          <p>No hay contenido aún. {isAdmin ? '¡Sé el primero en publicar algo!' : 'Vuelve pronto.'}</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filtered.map(item => (
            <div key={item.id} className="masonry-item" onClick={() => setLightbox(item)}>
              {item.youtube_id ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`}
                    alt={item.caption || 'Video YouTube'}
                    className="masonry-media"
                    loading="lazy"
                  />
                  <div className="yt-play-overlay"><span>▶</span></div>
                </>
              ) : (
                <img src={item.url} alt={item.caption || 'Galería'} className="masonry-media" loading="lazy" />
              )}
              <div className="masonry-overlay">
                {item.caption && <p className="gallery-caption">{item.caption}</p>}
                {isAdmin && (
                  <button className="btn-delete-gallery" onClick={e => { e.stopPropagation(); handleDelete(item); }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
};

export default Gallery;
