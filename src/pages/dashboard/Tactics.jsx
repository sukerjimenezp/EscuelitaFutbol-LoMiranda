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
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
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
import { showToast } from '../../components/Toast';
import './Tactics.css';

const Tactics = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(user?.category || 'sub10');
  const [formation, setFormation] = useState('4-3-3');
  const [deployedPlayers, setDeployedPlayers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [savingTactic, setSavingTactic] = useState(false);

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

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategoriesList(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('role', 'player')
        .neq('is_active', false);
      
      if (!error && data) {
        const adapted = data.map(p => ({
          ...p,
          name: p.full_name,
          image: p.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16,short17,short18,short19&earringsProbability=0`
        }));
        setPlayers(adapted);
      } else {
        setPlayers([]);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [selectedCategory]);

  // FUNC-03: Load saved tactic when category changes
  useEffect(() => {
    const loadTactic = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('tactics')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('created_by', user.id)
        .single();

      if (data) {
        setFormation(data.formation || '4-3-3');
        // We'll apply the saved deployed_players after players are loaded
        if (data.deployed_players && Array.isArray(data.deployed_players)) {
          setDeployedPlayers(data.deployed_players);
        }
      } else {
        setDeployedPlayers([]);
        setFormation('4-3-3');
      }
    };
    loadTactic();
  }, [selectedCategory, user?.id]);

  // FUNC-03: Save tactic to Supabase
  const saveTactic = async () => {
    if (!user?.id) return;
    setSavingTactic(true);
    try {
      const tacticData = {
        category_id: selectedCategory,
        formation,
        deployed_players: deployedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          overall: p.overall,
          image: p.image,
          x: p.x,
          y: p.y,
          isBlank: p.isBlank || false
        })),
        created_by: user.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tactics')
        .upsert(tacticData, { onConflict: 'category_id, created_by' });

      if (error) throw error;
      showToast('¡Formación guardada exitosamente!', 'success');
    } catch (err) {
      console.error('[Tactics] Save error:', err);
      showToast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSavingTactic(false);
    }
  };

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
              <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="formation-select glass"
            >
              {categoriesList.length > 0 ? (
                categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              ) : (
                <option value="sub10">Cargando categorías...</option>
              )}
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
            <button className="btn-primary" onClick={saveTactic} disabled={savingTactic}>
              <Save size={18} />
              {savingTactic ? 'Guardando...' : 'Guardar Táctica'}
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
              <h3>PLANTEL DISPONIBLE</h3>
              <span className="bench-count">{benchPlayers.length}</span>
            </div>
            
            <div className="bench-players-grid">
              {loading ? (
                <div className="bench-loading">
                  <RefreshCw size={24} className="spin-icon text-sky" />
                  <p>Cargando plantilla...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {benchPlayers.map(player => (
                    <motion.div 
                      key={player.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <MiniPlayerCard 
                        player={player} 
                        isOnPitch={false} 
                      />
                    </motion.div>
                  ))}
                  {benchPlayers.length === 0 && !loading && (
                    <div className="empty-bench-msg">
                      <p>Todos los jugadores están en el campo o no hay registros en esta categoría.</p>
                    </div>
                  )}
                </AnimatePresence>
              )}
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
