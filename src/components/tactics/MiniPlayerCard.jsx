import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Users } from 'lucide-react';
import './MiniPlayerCard.css';

const MiniPlayerCard = ({ player, isOnPitch, position }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id.toString(),
    data: {
      player,
      isOnPitch
    }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 999,
  } : undefined;

  // Si está en el campo, aplicamos la posición absoluta basada en coordenadas
  const pitchStyle = isOnPitch ? {
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)',
    position: 'absolute'
  } : {};

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, ...pitchStyle }}
      {...listeners} 
      {...attributes}
      className={`mini-player-card ${isOnPitch ? 'on-pitch' : 'on-bench'} ${player.isBlank ? 'is-blank' : ''}`}
    >
      <div className="mini-card-header">
        <span className="mini-ovr">{player.overall}</span>
        <span className="mini-pos">{player.position}</span>
      </div>
      {player.isBlank ? (
        <div className="blank-silhouette">
          <Users size={30} strokeWidth={1.5} />
        </div>
      ) : (
        <img src={player.image} alt={player.name} className="mini-avatar" />
      )}
      <div className="mini-name">{player.name.split(' ')[0]}</div>
    </div>
  );
};

export default MiniPlayerCard;
