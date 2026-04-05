import React, { createContext, useContext, useState } from 'react';

// Importar imágenes base (las leyendas y cracks actuales)
import alexisImg from '../images/avatares/alexis.png';
import cristianoImg from '../images/avatares/cristiano.png';
import messiImg from '../images/avatares/messi.png';
import neymarImg from '../images/avatares/neymar.png';
import ramosImg from '../images/avatares/ramos.png';
import salasImg from '../images/avatares/salas.png';
import vidalImg from '../images/avatares/vidal.png';
import zamoranoImg from '../images/avatares/zamorano.png';

const SkinsContext = createContext(null);

export const SkinsProvider = ({ children }) => {
  const [skins, setSkins] = useState([
    { id: 's1', name: 'Neymar Jr.', rarity: 'rare', condition: 'Jugar 5 partidos', unlocked: true, url: neymarImg },
    { id: 's2', name: 'Cristiano Ronaldo', rarity: 'rare', condition: '100% de Asistencia Semanal', unlocked: true, url: cristianoImg },
    { id: 's3', name: 'Lionel Messi', rarity: 'epic', condition: 'Goleador del Torneo', unlocked: true, url: messiImg },
    { id: 's4', name: 'Sergio Ramos', rarity: 'rare', condition: 'Capitán de Equipo', unlocked: true, url: ramosImg },
    { id: 's6', name: 'Arturo Vidal (El Rey)', rarity: 'epic', condition: 'Ganar 10 partidos consecutivos', unlocked: false, url: vidalImg },
    { id: 's7', name: 'Alexis Sánchez (Maravilla)', rarity: 'epic', condition: 'Marcar un Hattrick', unlocked: false, url: alexisImg },
    { id: 's8', name: 'Iván Zamorano (Bam Bam)', rarity: 'legendary', condition: 'Premio al Jugador del Mes', unlocked: false, url: zamoranoImg },
    { id: 's9', name: 'Marcelo Salas (El Matador)', rarity: 'legendary', condition: 'Campeón de Liga', unlocked: false, url: salasImg },
  ]);

  const addSkin = (newSkin) => {
    setSkins(prev => [...prev, { ...newSkin, id: `s_${Date.now()}`, unlocked: false }]);
  };

  const updateSkin = (id, updatedData) => {
    setSkins(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const deleteSkin = (id) => {
    setSkins(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SkinsContext.Provider value={{ skins, addSkin, updateSkin, deleteSkin }}>
      {children}
    </SkinsContext.Provider>
  );
};

export const useSkins = () => {
  const context = useContext(SkinsContext);
  if (!context) throw new Error('useSkins must be used within a SkinsProvider');
  return context;
};
