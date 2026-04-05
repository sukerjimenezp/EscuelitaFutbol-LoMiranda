import React, { useState } from 'react';
import { useLive } from '../../data/LiveContext';
import { 
  Radio, 
  Video, 
  ExternalLink, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import './StreamingConfig.css';

const StreamingConfig = () => {
  const { videoId, isLive, channelId, isAutoMode, updateLiveConfig } = useLive();
  const [localVideoId, setLocalVideoId] = useState(videoId);
  const [localChannelId, setLocalChannelId] = useState(channelId);
  const [localIsLive, setLocalIsLive] = useState(isLive);
  const [localIsAuto, setLocalIsAuto] = useState(isAutoMode);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = () => {
    updateLiveConfig({
      videoId: localVideoId,
      isLive: localIsLive,
      channelId: localChannelId,
      isAutoMode: localIsAuto
    });
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  // Helper para generar URL del reproductor
  const getEmbedUrl = () => {
    if (localIsAuto) return `https://www.youtube.com/embed/live_stream?channel=${localChannelId}`;
    return `https://www.youtube-nocookie.com/embed/${localVideoId}?rel=0`;
  };

  return (
    <div className="streaming-config-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Panel de <span className="text-sky">Transmisión</span></h1>
          <p className="dash-subtitle">Configura la señal en vivo para padres y seguidores.</p>
        </div>
      </div>

      <div className="streaming-config-layout">
        <div className="config-form-section glass">
          <div className="section-title">
            <Video size={20} className="text-sky" />
            <h2>Ajustes de YouTube Live</h2>
          </div>

          <div className="form-group">
            <label>MODO DE CONTROL</label>
            <div className="auto-toggle-card glass" onClick={() => setLocalIsAuto(!localIsAuto)}>
              <div className={`mode-indicator ${localIsAuto ? 'auto' : 'manual'}`}>
                {localIsAuto ? 'AUTOMÁTICO' : 'MANUAL'}
              </div>
              <div className="mode-details">
                <strong>{localIsAuto ? 'Usar mi Canal Oficial' : 'Ingresar ID de Video'}</strong>
                <p>{localIsAuto ? 'Detecta el directo solo con el ID del canal.' : 'Debes pegar el ID de cada video manualmente.'}</p>
              </div>
            </div>
          </div>

          {!localIsAuto ? (
            <div className="form-group">
              <label>ID DEL VIDEO (YOUTUBE)</label>
              <div className="input-with-icon">
                <PlayCircle size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Ej: dQw4w9WgXcQ"
                  value={localVideoId}
                  onChange={(e) => setLocalVideoId(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>ID DEL CANAL (UCPKY...)</label>
              <div className="input-with-icon">
                <Radio size={18} className="input-icon text-sky" />
                <input 
                  type="text" 
                  value={localChannelId}
                  onChange={(e) => setLocalChannelId(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>ESTADO DE SEÑAL</label>
            <div className="live-toggle-wrapper">
              <button 
                className={`toggle-btn ${localIsLive ? 'active' : ''}`}
                onClick={() => setLocalIsLive(true)}
              >
                <div className="pulse-dot"></div>
                MOSTRAR REPRODUCTOR
              </button>
              <button 
                className={`toggle-btn ${!localIsLive ? 'active offline' : ''}`}
                onClick={() => setLocalIsLive(false)}
              >
                OCULTAR SEÑAL
              </button>
            </div>
          </div>

          <div className="info-box-config">
            <AlertCircle size={18} />
            <p>
              {localIsAuto 
                ? "Modo Automático: La web mostrará siempre la transmisión activa de tu canal."
                : "Modo Manual: Debes actualizar el ID de video para cada transmisión nueva."}
            </p>
          </div>

          <button className="btn-primary save-live-btn" onClick={handleSave}>
            <Save size={18} />
            Guardar y Sincronizar
          </button>

          {showSavedMsg && (
            <motion.div className="saved-feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CheckCircle2 size={16} /> Cambios aplicados correctamente
            </motion.div>
          )}
        </div>

        <div className="streaming-preview-section glass">
          <div className="section-title">
            <Radio size={20} className={localIsLive ? 'text-red pulse' : 'text-muted'} />
            <h2>Previsualización de Señal</h2>
          </div>

          <div className="preview-player-container">
            <div className="preview-aspect-ratio">
              <iframe
                src={getEmbedUrl()}
                title="YouTube Preview"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="preview-status-footer">
            <div className={`status-pill ${localIsLive ? 'live' : 'offline'}`}>
              {localIsLive ? 'PÚBLICO' : 'SIN SEÑAL'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingConfig;
