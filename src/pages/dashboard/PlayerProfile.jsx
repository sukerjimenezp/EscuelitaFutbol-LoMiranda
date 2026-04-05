import React, { useState } from 'react';
import { useAuth } from '../../data/AuthContext';
import { Lock, Unlock, Zap, Trophy, Shield, Star, CheckCircle, MessageSquare, Heart } from 'lucide-react';
import './PlayerProfile.css';

import PlayerCard from '../../components/PlayerCard';
import { playersByCategory } from '../../data/mockData';

// Importar imágenes locales desde src/images/avatares
import { useSkins } from '../../data/SkinsContext';

const PlayerProfile = () => {
  const { user, updateUserAvatar } = useAuth();
  const { skins } = useSkins();
  
  // Cargar feedback del profe para este jugador
  const feedback = JSON.parse(localStorage.getItem(`coach_feedback_${user?.id}`)) || {
    title: '¡BUEN TRABAJO!',
    message: `Hola ${user?.name.split(' ')[0]}, vi tus últimos entrenamientos y miedos en la cancha, ¡has mejorado mucho!`,
    points: ['¡Excelente esfuerzo corriendo en la cancha! 🏃', 'Trata de levantar más la cabeza al pasar el balón 👀', 'Me gusta mucho tu actitud de compañerismo 🤝'],
    footer: '¡A seguir divirtiéndonos!'
  };
  
  // Seleccionar la skin actual
  const currentSkin = skins.find(s => s.url === user?.avatar) || skins[0];

  // Stats simulados del jugador
  const playerStats = {
    matches: 12,
    goals: 0,
    attendance: '85%',
  };

  const handleEquipSkin = (skin) => {
    if (skin.unlocked) {
      updateUserAvatar(skin.url);
    }
  };

  // Encontrar stats tipo FIFA para la carta
  let fifaStats = null;
  for (const cat in playersByCategory) {
    const found = playersByCategory[cat].find(p => p.name === user?.name || p.name.split(' ')[0] === user?.username);
    if (found) fifaStats = { ...found };
  }
  
  if (!fifaStats) {
    fifaStats = { name: user?.name, overall: 75, position: 'MED', pace: 70, shooting: 65, passing: 72, dribbling: 70, defense: 60, physical: 68 };
  }
  fifaStats.image = user?.avatar; // Sincronizar la imagen de la carta con la skin activa

  return (
    <div className="gamer-profile-container" style={{ maxWidth: '100%' }}>
      
      {/* BANNER PRINCIPAL INTEGRADO (Carta + Stats) para máximo ahorro de espacio */}
      <div className="gamer-profile-banner" style={{ display: 'flex', flexDirection: 'row', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* La Ficha integrada a la izquierda dentro del banner */}
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'left center', margin: '-40px 0' }}>
          <PlayerCard player={fifaStats} />
        </div>

        {/* Resumen e Info a la derecha en el mismo bloque */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="gp-user-info">
            <h1 style={{ fontSize: '3rem', margin: 0 }}>{user?.name}</h1>
            <span className="gp-role-badge" style={{ marginTop: '10px' }}><Zap size={16} /> JUGADOR ACTIVO</span>
          </div>

          <div className="gp-stats-row" style={{ marginTop: '10px' }}>
            <div className="gp-stat-box" style={{ flex: 1, justifyContent: 'center' }}>
              <Shield className="stat-icon text-sky" size={32} />
              <div className="span-col">
                <span className="stat-num">{playerStats.matches}</span>
                <span className="stat-lbl">PARTIDOS</span>
              </div>
            </div>
            <div className="gp-stat-box" style={{ flex: 1, justifyContent: 'center' }}>
              <TargetIcon className="stat-icon text-red" size={32} />
              <div className="span-col">
                <span className="stat-num">{playerStats.goals}</span>
                <span className="stat-lbl">GOLES</span>
              </div>
            </div>
            <div className="gp-stat-box" style={{ flex: 1, justifyContent: 'center' }}>
              <CheckCircle className="stat-icon text-green" size={32} />
              <div className="span-col">
                <span className="stat-num">{playerStats.attendance}</span>
                <span className="stat-lbl">ASISTENCIA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: EL PROFE DICE (Diseño Premium del Usuario) */}
      <div className="coach-feedback-section">
        <div className="coach-feedback-header">
          <MessageSquare size={24} className="text-secondary-400" />
          <div className="header-titles">
            <h2 className="title-yellow">EL PROFE</h2>
            <h2 className="title-yellow">DICE</h2>
          </div>
        </div>

        <div className="coach-feedback-card glass">
          <div className="card-top">
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <span className="feedback-badge-top">{feedback.title}</span>
          </div>

          <p className="main-coach-msg">
            {feedback.message}
          </p>

          <div className="specific-points-list">
            {feedback.points.map((point, index) => (
              <div key={index} className="point-item glass">
                <Heart size={16} fill="#ef4444" color="#ef4444" className="heart-icon" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="card-footer-msg">
            <Trophy size={16} className="text-sky" />
            <span>{feedback.footer}</span>
          </div>
        </div>
      </div>

      {/* Armario de Skins (Skin Locker) Ocupando 100% del ancho abajo */}
      <div className="skin-locker-section">
        <div className="locker-header">
          <h2><Star size={24} color="#fbbf24" /> Armario de Skins</h2>
          <p>Desbloquea Leyendas de La Roja y del Fútbol Mundial</p>
        </div>

        <div className="skins-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {skins.map((skin) => {
            const isEquipped = user?.avatar === skin.url;
            
            return (
              <div 
                key={skin.id} 
                className={`skin-card rarity-${skin.rarity} ${skin.unlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`}
                onClick={() => handleEquipSkin(skin)}
              >
                {!skin.unlocked && (
                  <div className="skin-lock-overlay">
                    <Lock size={32} color="#fff" />
                    <span className="lock-text">BLOQUEADO</span>
                  </div>
                )}
                
                <div className="skin-image-container">
                  <img src={skin.url} alt={skin.name} />
                </div>
                
                <div className="skin-info">
                  <h3>{skin.name}</h3>
                  <div className="skin-rarity-badge">{skin.rarity.toUpperCase()}</div>
                  <div className="skin-condition">
                    {skin.unlocked ? <Unlock size={12} /> : <Trophy size={12} />} 
                    {skin.condition}
                  </div>
                </div>

                {isEquipped && <div className="equipped-stamp">EQUIPADO</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Necesitaba un componente target extra para el icono de goles
const TargetIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

export default PlayerProfile;
