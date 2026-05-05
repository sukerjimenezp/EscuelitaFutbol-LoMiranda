import React from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player }) => {
  const { name, overall, position, pace, shooting, passing, dribbling, defense, physical, image } = player;

  return (
    <div className="player-card-container">
      <div className="player-card">
        {/* Top Section */}
        <div className="card-header">
          <div className="rating-info">
            <span className="rating-value">{overall}</span>
            <span className="rating-pos">{position}</span>
            <div className="club-badge-placeholder">LM</div>
          </div>
          <div className="player-face">
            <img src={image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Player')}&background=071428&color=fff&bold=true`} alt={name} />
          </div>
        </div>

        {/* Middle Section (Name) */}
        <div className="player-info">
          <h2 className="player-full-name">{name}</h2>
          <div className="divider-line"></div>
        </div>

        {/* Bottom Section (Stats) */}
        <div className="player-stats">
          <div className="stats-col">
            <div className="stat-item"><span className="stat-val">{pace}</span> PAC</div>
            <div className="stat-item"><span className="stat-val">{shooting}</span> SHO</div>
            <div className="stat-item"><span className="stat-val">{passing}</span> PAS</div>
          </div>
          <div className="stats-divider"></div>
          <div className="stats-col">
            <div className="stat-item"><span className="stat-val">{dribbling}</span> DRI</div>
            <div className="stat-item"><span className="stat-val">{defense}</span> DEF</div>
            <div className="stat-item"><span className="stat-val">{physical}</span> PHY</div>
          </div>
        </div>
        
        {/* Visual Flair */}
        <div className="card-sheen"></div>
        <div className="card-texture"></div>
      </div>
    </div>
  );
};

export default PlayerCard;
