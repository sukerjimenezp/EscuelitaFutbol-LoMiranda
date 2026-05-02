import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { useAuth } from '../../data/AuthContext';
import { playersByCategory, categories } from '../../data/mockData';
import { FORMATIONS } from '../../data/formations';
import SoccerPitch from '../../components/tactics/SoccerPitch';
import MiniPlayerCard from '../../components/tactics/MiniPlayerCard';
import { 
  Users, 
  Settings, 
  Save, 
  RefreshCw,
  Layout,
  Maximize2,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Tactics.css';

const Tactics = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(user?.category || 'sub10');
  const [formation, setFormation] = useState('4-3-3');
  const [deployedPlayers, setDeployedPlayers] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const BLANK_PLAYER = {
    id: 'blank-', // Se completará con el index
    name: 'DISPONIBLE',
    overall: '??',
    position: '---',
    image: '/images/avatares/blank.png',
    isBlank: true
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const players = playersByCategory[selectedCategory] || [];
  const benchPlayers = players.filter(p => !deployedPlayers.find(dp => dp.id === p.id));

  // Función para aplicar una formación automáticamente
  const applyFormation = (name) => {
    const coords = FORMATIONS[name];
    if (!coords) return;

    // Si no hay jugadores desplegados, tomamos los primeros 11 del banco
    let basePlayers = deployedPlayers.length > 0 ? [...deployedPlayers] : players.slice(0, 11);
    
    // Si tenemos menos de 11, completamos con los que falten de la lista real
    if (basePlayers.length < 11) {
      const extraNeeded = 11 - basePlayers.length;
      const available = players.filter(p => !basePlayers.find(bp => bp.id === p.id));
      basePlayers = [...basePlayers, ...available.slice(0, extraNeeded)];
    }

    // Si después de completar con reales todavía faltan, ponemos blancos
    const finalPlayers = coords.map((coord, index) => {
      const existingPlayer = basePlayers[index];
      if (existingPlayer) {
        return { ...existingPlayer, x: coord.x, y: coord.y };
      } else {
        return { 
          ...BLANK_PLAYER, 
          id: `blank-${index}`,
          x: coord.x, 
          y: coord.y 
        };
      }
    });

    setDeployedPlayers(finalPlayers);
    setFormation(name);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    setActiveId(null);

    if (over && over.id === 'soccer-pitch') {
      const player = players.find(p => p.id.toString() === active.id);
      if (!player) return;

      setDeployedPlayers((prev) => {
        const existing = prev.find(p => p.id === player.id);
        
        // Calcular nueva posición basada en el drop
        const rect = over.rect;
        const x = ((event.activatorEvent.clientX + delta.x - rect.left) / rect.width) * 100;
        const y = ((event.activatorEvent.clientY + delta.y - rect.top) / rect.height) * 100;

        if (existing) {
          return prev.map(p => p.id === player.id ? { ...p, x, y } : p);
        }
        if (prev.length >= 11) return prev;
        return [...prev, { ...player, x, y }];
      });
    } else if (!over) {
      setDeployedPlayers((prev) => prev.filter(p => p.id.toString() !== active.id));
    }
  };

  const activePlayer = players.find(p => p.id.toString() === activeId);

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="tactics-page">
        <div className="page-header">
          <div className="header-info">
            <h1 className="dash-title">Pizarra <span className="text-sky">Táctica</span></h1>
            <p className="dash-subtitle">Configura la alineación y estrategia para el próximo encuentro.</p>
          </div>
          <div className="header-actions">
            <div className="formation-selector glass">
              <Users size={18} className="text-sky" />
              <select value={selectedCategory} onChange={(e) => {
                setSelectedCategory(e.target.value);
                setDeployedPlayers([]); 
              }}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="formation-selector glass">
              <Layout size={18} className="text-sky" />
              <select value={formation} onChange={(e) => applyFormation(e.target.value)}>
                <option value="" disabled>Seleccionar Formación</option>
                {Object.keys(FORMATIONS).map(f => (
                  <option key={f} value={f}>{f} (Clásico)</option>
                ))}
              </select>
            </div>
            <button className="btn-secondary-outline" onClick={() => setDeployedPlayers([])}>
              <RefreshCw size={18} />
              Reiniciar
            </button>
            <button className="btn-primary" onClick={() => alert('Táctica guardada con éxito')}>
              <Save size={18} />
              Guardar Táctica
            </button>
          </div>
        </div>

        <div className="tactics-container">
          <div className="pitch-section glass">
            <SoccerPitch>
              {deployedPlayers.map(p => (
                <motion.div 
                  key={p.id} 
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ 
                    position: 'absolute', 
                    left: `${p.x}%`, 
                    top: `${p.y}%`, 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100
                  }}
                >
                  <MiniPlayerCard 
                    player={p} 
                    isOnPitch={true} 
                    position={{ x: 0, y: 0 }} // Ya manejado por el div padre
                  />
                </motion.div>
              ))}
              {deployedPlayers.length === 0 && (
                <div className="empty-pitch-notif">
                  <MousePointer2 size={32} className="text-sky" style={{ marginBottom: '1rem' }} />
                  <p>Arrastra jugadores desde el banco para iniciar la alineación o selecciona una formación arriba.</p>
                </div>
              )}
            </SoccerPitch>
          </div>

          <div className="bench-section glass">
            <div className="bench-header">
              <Users size={20} className="text-sky" />
              <h3>Banco ({benchPlayers.length})</h3>
            </div>
            <div className="bench-players-grid">
              <AnimatePresence>
                {benchPlayers.map(player => (
                  <motion.div 
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <MiniPlayerCard 
                      player={player} 
                      isOnPitch={false} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <div style={{ transform: 'scale(1.1)', opacity: 0.9 }}>
            <MiniPlayerCard 
              player={activePlayer} 
              isOnPitch={false} 
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Tactics;
