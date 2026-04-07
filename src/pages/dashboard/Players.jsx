import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronRight,
  UserPlus,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { categories } from '../../data/mockData';
import './Players.css';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('sub10');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  
  const [newPlayer, setNewPlayer] = useState({
    full_name: '',
    dorsal: 10,
    position: 'DC',
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defense: 50,
    physical: 50,
    category_id: 'sub10'
  });

  const [overall, setOverall] = useState(50);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('category_id', selectedCategory)
      .eq('role', 'player');
    
    if (error) console.error('Error fetching players:', error);
    else setPlayers(data || []);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    const stats = [
      newPlayer.pace, 
      newPlayer.shooting, 
      newPlayer.passing, 
      newPlayer.dribbling, 
      newPlayer.defense, 
      newPlayer.physical
    ];
    const avg = Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);
    setOverall(avg);
  }, [newPlayer]);

  const handleInputChange = (field, value) => {
    setNewPlayer(prev => ({ 
      ...prev, 
      [field]: field === 'full_name' || field === 'position' || field === 'category_id' ? value : (parseInt(value) || 0)
    }));
  };

  const handleEditClick = (player) => {
    setEditingPlayerId(player.id);
    setNewPlayer({
      ...player,
      category_id: selectedCategory
    });
    setShowModal(true);
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este jugador?')) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', playerId);
      
      if (error) alert('Error al eliminar: ' + error.message);
      else fetchPlayers();
    }
  };

  const handleSave = async () => {
    if (!newPlayer.full_name) return alert('Debes ingresar el nombre');
    
    const playerToSave = {
      full_name: newPlayer.full_name,
      dorsal: newPlayer.dorsal,
      position: newPlayer.position,
      category_id: newPlayer.category_id,
      overall: overall,
      pace: newPlayer.pace,
      shooting: newPlayer.shooting,
      passing: newPlayer.passing,
      dribbling: newPlayer.dribbling,
      defense: newPlayer.defense,
      physical: newPlayer.physical,
      role: 'player',
      avatar_url: newPlayer.avatar_url || `https://api.dicebear.com/7.x/lorelei/svg?seed=${newPlayer.full_name}`,
      email: newPlayer.email || `${newPlayer.full_name.replace(/\s/g, '').toLowerCase()}@escuela.cl`
    };

    if (editingPlayerId) {
      const { error } = await supabase
        .from('profiles')
        .update(playerToSave)
        .eq('id', editingPlayerId);
      
      if (error) alert(error.message);
      else {
        alert('Ficha actualizada');
        fetchPlayers();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert([playerToSave]);
      
      if (error) alert(error.message);
      else {
        alert('Jugador registrado');
        fetchPlayers();
        setShowModal(false);
      }
    }
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setNewPlayer({
      full_name: '', dorsal: 10, position: 'DC', pace: 50, shooting: 50, passing: 50, dribbling: 50, defense: 50, physical: 50, category_id: selectedCategory
    });
  };

  const filteredPlayers = players.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="players-config-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Jugadores</span></h1>
          <p className="dash-subtitle">Administra la plantilla y estadísticas de cada categoría.</p>
        </div>
        <button className="btn-primary add-player-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <UserPlus size={18} />
          Nuevo Jugador
        </button>
      </div>

      <div className="filters-row glass">
        <div className="category-select">
          <Filter size={18} className="text-muted" />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="search-input-wrapper">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="players-list-container glass">
        <div className="list-header">
          <div className="col-player">Jugador</div>
          <div className="col-pos">Pos</div>
          <div className="col-stats">Stats (PAC/SHO/PAS/DRI/DEF/PHY)</div>
          <div className="col-ovr">OVR</div>
          <div className="col-actions">Acciones</div>
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="list-body">
            {filteredPlayers.map(player => (
              <div key={player.id} className="player-row">
                <div className="col-player">
                  <img src={player.avatar_url} alt={player.full_name} className="row-avatar" />
                  <span className="player-name">{player.full_name}</span>
                </div>
                <div className="col-pos">
                  <span className="pos-badge">{player.position}</span>
                </div>
                <div className="col-dorsal">
                  <strong>#{player.dorsal || '-'}</strong>
                </div>
                <div className="col-stats">
                  <div className="stats-mini-grid">
                    <span>{player.pace}</span>
                    <span>{player.shooting}</span>
                    <span>{player.passing}</span>
                    <span>{player.dribbling}</span>
                    <span>{player.defense}</span>
                    <span>{player.physical}</span>
                  </div>
                </div>
                <div className="col-ovr">
                  <span className={`ovr-badge ${player.overall >= 80 ? 'gold' : 'silver'}`}>
                    {player.overall}
                  </span>
                </div>
                <div className="col-actions">
                  <button className="icon-btn edit" title="Editar" onClick={() => handleEditClick(player)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn delete" title="Eliminar" onClick={() => handleDeletePlayer(player.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No se encontraron jugadores en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Modal Edición/Creación de Jugador */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="player-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>{editingPlayerId ? 'Editar' : 'Nuevo'} <span className="text-sky">Jugador</span></h2>
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>

              <div className="modal-body">
                <div className="player-preview-section">
                  <div className="player-preview-card glass">
                    <div className="preview-ovr">
                      <span>{overall}</span>
                      <small>{newPlayer.position}</small>
                    </div>
                    <img src={newPlayer.avatar_url || `https://api.dicebear.com/7.x/lorelei/svg?seed=${newPlayer.full_name || 'default'}`} alt="Preview" />
                    <div className="preview-name">{newPlayer.full_name || 'NOMBRE JUGADOR'} {newPlayer.dorsal ? `(#${newPlayer.dorsal})` : ''}</div>
                  </div>
                </div>

                <div className="player-form">
                  <div className="form-row">
                    <div className="field">
                      <label>Nombre Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Mateo Miranda"
                        value={newPlayer.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Posición</label>
                      <select value={newPlayer.position} onChange={e => handleInputChange('position', e.target.value)}>
                        <option value="POR">POR</option>
                        <option value="DFC">DFC</option>
                        <option value="LI">LI</option>
                        <option value="LD">LD</option>
                        <option value="MC">MC</option>
                        <option value="MCO">MCO</option>
                        <option value="EI">EI</option>
                        <option value="ED">ED</option>
                        <option value="DC">DC</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Dorsal N°</label>
                      <input 
                        type="number" 
                        value={newPlayer.dorsal}
                        onChange={(e) => handleInputChange('dorsal', e.target.value)}
                        placeholder="Ej: 10"
                        min="1" max="99"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Categoría</label>
                      <select value={newPlayer.category} onChange={e => handleInputChange('category', e.target.value)}>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="stats-inputs-grid">
                    <div className="stat-input">
                      <label>RIT (PAC)</label>
                      <input type="range" min="1" max="99" value={newPlayer.pace} onChange={e => handleInputChange('pace', e.target.value)} />
                      <span>{newPlayer.pace}</span>
                    </div>
                    <div className="stat-input">
                      <label>TIR (SHO)</label>
                      <input type="range" min="1" max="99" value={newPlayer.shooting} onChange={e => handleInputChange('shooting', e.target.value)} />
                      <span>{newPlayer.shooting}</span>
                    </div>
                    <div className="stat-input">
                      <label>PAS (PAS)</label>
                      <input type="range" min="1" max="99" value={newPlayer.passing} onChange={e => handleInputChange('passing', e.target.value)} />
                      <span>{newPlayer.passing}</span>
                    </div>
                    <div className="stat-input">
                      <label>REG (DRI)</label>
                      <input type="range" min="1" max="99" value={newPlayer.dribbling} onChange={e => handleInputChange('dribbling', e.target.value)} />
                      <span>{newPlayer.dribbling}</span>
                    </div>
                    <div className="stat-input">
                      <label>DEF (DEF)</label>
                      <input type="range" min="1" max="99" value={newPlayer.defense} onChange={e => handleInputChange('defense', e.target.value)} />
                      <span>{newPlayer.defense}</span>
                    </div>
                    <div className="stat-input">
                      <label>FIS (PHY)</label>
                      <input type="range" min="1" max="99" value={newPlayer.physical} onChange={e => handleInputChange('physical', e.target.value)} />
                      <span>{newPlayer.physical}</span>
                    </div>
                  </div>

                  <button className="btn-primary save-action" onClick={handleSave}>
                    <Save size={18} />
                    {editingPlayerId ? 'Guardar Cambios' : 'Registrar Jugador'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Players;
