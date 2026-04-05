import React from 'react';
import { useLive } from '../data/LiveContext';
import './Streaming.css';

const Streaming = () => {
  const { videoId, isLive, isAutoMode, channelId } = useLive();

  const getEmbedUrl = () => {
    if (isAutoMode) return `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  return (
    <div className="streaming-page">
      <div className="stream-container">
        <header className="stream-header">
          <div className="live-indicator">
            <span className={`dot ${isLive ? 'pulse' : ''}`}></span>
            {isLive ? 'EN VIVO' : 'DISCONNECTED'}
          </div>
          <h1 className="stream-title">
            Transmisión <span className="text-sky">Oficial</span>
          </h1>
          <p className="stream-subtitle">Escuelita Lo Miranda FC</p>
        </header>

        <div className="player-wrapper glass">
          {isLive && (videoId || isAutoMode) ? (
            <div className="video-responsive">
              <iframe
                src={getEmbedUrl()}
                title="YouTube Live Stream"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="no-stream">
              <div className="no-stream-icon">📺</div>
              <h3>No hay señal en este momento</h3>
              <p>Las transmisiones comienzan 15 minutos antes de cada partido programado. ¡No te lo pierdas!</p>
              <div className="section-line"></div>
              <div className="next-match-teaser">
                <span>Próximo Encuentro:</span>
                <strong>Sábado 10:00 AM • Estadio Municipal</strong>
              </div>
            </div>
          )}
        </div>

        <div className="stream-info">
          <div className="info-card glass">
            <h4>📡 Fuente de Señal</h4>
            <p>YouTube Live (HD 1080p)</p>
          </div>
          <div className="info-card glass">
            <h4>🎙️ Comentarios</h4>
            <p>Señal Ambiente disponible</p>
          </div>
          <div className="info-card glass">
            <h4>📱 Multi-dispositivo</h4>
            <p>Velo en tu Smart TV, Tablet o Celular</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaming;
