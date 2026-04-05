import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import './SoccerPitch.css';

const SoccerPitch = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'soccer-pitch',
  });

  const style = {
    backgroundColor: isOver ? 'rgba(56, 189, 248, 0.1)' : undefined,
    transition: 'background-color 0.2s ease',
  };

  return (
    <div 
      ref={setNodeRef} 
      className="soccer-pitch-container" 
      style={style}
    >
      <div className="pitch-grass">
        {/* Líneas del campo en SVG */}
        <svg className="pitch-lines" viewBox="0 0 100 70" preserveAspectRatio="none">
          <rect x="2" y="2" width="96" height="66" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <line x1="50" y1="2" x2="50" y2="68" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <circle cx="50" cy="35" r="9.15" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <circle cx="50" cy="35" r="0.5" fill="white" />
          <rect x="2" y="15" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <rect x="2" y="25.4" width="5.5" height="19.2" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <circle cx="11" cy="35" r="0.5" fill="white" />
          <path d="M 18.5 28.5 A 9.15 9.15 0 0 1 18.5 41.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <rect x="81.5" y="15" width="16.5" height="40" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <rect x="92.5" y="25.4" width="5.5" height="19.2" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <circle cx="89" cy="35" r="0.5" fill="white" />
          <path d="M 81.5 28.5 A 9.15 9.15 0 0 0 81.5 41.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <path d="M 2 3 A 1 1 0 0 0 3 2" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <path d="M 97 2 A 1 1 0 0 0 98 3" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <path d="M 3 68 A 1 1 0 0 0 2 67" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <path d="M 98 67 A 1 1 0 0 0 97 68" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
        </svg>

        <div className="pitch-players-overlay">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SoccerPitch;
