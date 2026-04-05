import React, { useState, useEffect } from 'react';
import { 
  categories, 
  playersByCategory 
} from '../../data/mockData';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Save, 
  Heart, 
  Plus, 
  Trash2,
  CheckCircle,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CoachMessages.css';

const CoachMessages = () => {
  const [selectedCategory, setSelectedCategory] = useState('sub10');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  const [feedback, setFeedback] = useState({
    title: '¡BUEN TRABAJO!',
    message: '',
    points: [],
    footer: '¡A seguir divirtiéndonos!'
  });

  const [newPoint, setNewPoint] = useState('');

  // Cargar datos de localStorage al seleccionar jugador
  useEffect(() => {
    if (selectedPlayer) {
      const saved = localStorage.getItem(`coach_feedback_${selectedPlayer.id}`);
      if (saved) {
        setFeedback(JSON.parse(saved));
      } else {
        setFeedback({
          title: '¡BUEN TRABAJO!',
          message: `Hola ${selectedPlayer.name.split(' ')[0]}, vi tus últimos entrenamientos y...`,
          points: ['Excelente actitud en el campo', 'Sigue practicando tu técnica de pase'],
          footer: '¡A seguir divirtiéndonos!'
        });
      }
    }
  }, [selectedPlayer]);

  const handleSave = () => {
    if (!selectedPlayer) return;
    localStorage.setItem(`coach_feedback_${selectedPlayer.id}`, JSON.stringify(feedback));
    alert(`Mensaje para ${selectedPlayer.name} guardado con éxito.`);
  };

  const addPoint = () => {
    if (newPoint.trim()) {
      setFeedback(prev => ({ ...prev, points: [...prev.points, newPoint.trim()] }));
      setNewPoint('');
    }
  };

  const removePoint = (index) => {
    setFeedback(prev => ({ 
      ...prev, 
      points: prev.points.filter((_, i) => i !== index) 
    }));
  };

  const players = playersByCategory[selectedCategory] || [];
  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="coach-messages-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Motivación: <span className="text-sky">El Profe Dice</span></h1>
          <p className="dash-subtitle">Envía mensajes personalizados y consejos tácticos a cada jugador.</p>
        </div>
      </div>

      <div className="coach-messages-layout">
        {/* Lado Izquierdo: Lista de Jugadores */}
        <div className="players-selector-sidebar glass">
          <div className="selector-filters">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <div className="search-mini">
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="players-mini-list">
            {filteredPlayers.map(p => (
              <button 
                key={p.id} 
                className={`player-item-btn ${selectedPlayer?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPlayer(p)}
              >
                <img src={p.image} alt="" />
                <div className="player-btn-info">
                  <span className="p-name">{p.name}</span>
                  <span className="p-dorsal">#{p.dorsal}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Editor de Feedback */}
        <div className="feedback-editor-container">
          {selectedPlayer ? (
            <motion.div 
              className="feedback-form-card glass"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedPlayer.id}
            >
              <div className="editor-header">
                <MessageSquare size={20} className="text-sky" />
                <h2>Editando Mensaje para <span className="text-sky">{selectedPlayer.name} (#{selectedPlayer.dorsal})</span></h2>
              </div>

              <div className="form-fields">
                <div className="field">
                  <label>Título del Mensaje</label>
                  <input 
                    type="text" 
                    value={feedback.title} 
                    onChange={e => setFeedback({...feedback, title: e.target.value})}
                    placeholder="Ej: ¡BUEN TRABAJO!"
                  />
                </div>

                <div className="field">
                  <label>Mensaje Motivacional / Cuerpo</label>
                  <textarea 
                    rows={4}
                    value={feedback.message}
                    onChange={e => setFeedback({...feedback, message: e.target.value})}
                    placeholder="Escribe aquí tu análisis o palabras de aliento..."
                  />
                </div>

                <div className="field">
                  <label>Puntos Específicos (con Corazón ❤️)</label>
                  <div className="points-input-row">
                    <input 
                      type="text" 
                      value={newPoint}
                      onChange={e => setNewPoint(e.target.value)}
                      placeholder="Ej: Excelente esfuerzo hoy"
                      onKeyPress={e => e.key === 'Enter' && addPoint()}
                    />
                    <button className="add-point-btn" onClick={addPoint}><Plus size={20} /></button>
                  </div>
                  
                  <div className="points-list-editor">
                    {feedback.points.map((p, i) => (
                      <div key={i} className="point-item-edit">
                        <Heart size={14} fill="#ef4444" color="#ef4444" />
                        <span>{p}</span>
                        <button onClick={() => removePoint(i)}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Frase de Cierre</label>
                  <input 
                    type="text" 
                    value={feedback.footer} 
                    onChange={e => setFeedback({...feedback, footer: e.target.value})}
                  />
                </div>

                <button className="btn-primary save-feedback-btn" onClick={handleSave}>
                  <Save size={18} />
                  Publicar en el Perfil de {selectedPlayer.name.split(' ')[0]}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="empty-feedback-state glass">
              <MessageSquare size={48} className="text-muted" />
              <h3>Selecciona un jugador para motivarlo</h3>
              <p>Tu mensaje aparecerá directamente en su muro personal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachMessages;
