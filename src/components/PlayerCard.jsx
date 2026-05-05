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
            <img src={image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'Player')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16,short17,short18,short19&earringsProbability=0`} alt={name} />
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
