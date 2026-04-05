import React, { useState, useEffect } from 'react';
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
import { categories, playersByCategory as initialPlayers } from '../../data/mockData';
import './Players.css';

const Players = () => {
  const [playersMap, setPlayersMap] = useState(initialPlayers);
  const [selectedCategory, setSelectedCategory] = useState('sub10');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  
  // Estado para el jugador (nuevo o editado)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    dorsal: 10,
    position: 'DC',
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defense: 50,
    physical: 50,
    category: 'sub10'
  });

  const [overall, setOverall] = useState(50);

  // Cálculo automático del Overall
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
      [field]: field === 'name' || field === 'position' || field === 'category' ? value : (parseInt(value) || 0)
    }));
  };

  const handleEditClick = (player) => {
    setEditingPlayerId(player.id);
    setNewPlayer({
      ...player,
      category: selectedCategory // Usamos la categoría actual
    });
    setShowModal(true);
  };

  const handleDeletePlayer = (playerId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este jugador de la plantilla?')) {
      const updatedMap = { ...playersMap };
      updatedMap[selectedCategory] = updatedMap[selectedCategory].filter(p => p.id !== playerId);
      setPlayersMap(updatedMap);
    }
  };

  const handleSave = () => {
    if (!newPlayer.name) return alert('Debes ingresar el nombre del jugador');
    
    const playerToSave = {
      ...newPlayer,
      overall: overall,
      image: newPlayer.image || `https://api.dicebear.com/7.x/lorelei/svg?seed=${newPlayer.name}`
    };

    const updatedMap = { ...playersMap };
    
    if (editingPlayerId) {
      // Editar existente
      updatedMap[newPlayer.category] = updatedMap[newPlayer.category].map(p => 
        p.id === editingPlayerId ? playerToSave : p
      );
      alert('Ficha de jugador actualizada');
    } else {
      // Crear nuevo
      playerToSave.id = Date.now();
      updatedMap[newPlayer.category].push(playerToSave);
      alert('Jugador registrado con éxito');
    }
    
    setPlayersMap(updatedMap);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setNewPlayer({
      name: '', dorsal: 10, position: 'DC', pace: 50, shooting: 50, passing: 50, dribbling: 50, defense: 50, physical: 50, category: selectedCategory
    });
  };

  const players = playersMap[selectedCategory] || [];
  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <img src={player.image} alt={player.name} className="row-avatar" />
                  <span className="player-name">{player.name}</span>
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
                    <img src={newPlayer.image || `https://api.dicebear.com/7.x/lorelei/svg?seed=${newPlayer.name || 'default'}`} alt="Preview" />
                    <div className="preview-name">{newPlayer.name || 'NOMBRE JUGADOR'} {newPlayer.dorsal ? `(#${newPlayer.dorsal})` : ''}</div>
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
