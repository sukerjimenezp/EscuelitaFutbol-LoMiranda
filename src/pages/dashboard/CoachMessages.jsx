import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
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
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState([]);
  
  const [feedback, setFeedback] = useState({
    title: '¡BUEN TRABAJO!',
    message: '',
    points: [],
    footer: '¡A seguir divirtiéndonos!'
  });

  const [newPoint, setNewPoint] = useState('');

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('category_id', selectedCategory)
      .eq('role', 'player');
    
    setPlayers(data || []);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategoriesList(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const fetchPlayerFeedback = useCallback(async (playerId) => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setFeedback(data);
    } else {
      setFeedback({
        title: '¡BUEN TRABAJO!',
        message: `Hola ${selectedPlayer.full_name.split(' ')[0]}, vi tus últimos entrenamientos y...`,
        points: ['Excelente actitud en el campo', 'Sigue practicando tu técnica de pase'],
        footer: '¡A seguir divirtiéndonos!'
      });
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerFeedback(selectedPlayer.id);
    }
  }, [selectedPlayer, fetchPlayerFeedback]);

  const handleSave = async () => {
    if (!selectedPlayer) return;
    
    const { error } = await supabase
      .from('feedback')
      .upsert({
        player_id: selectedPlayer.id,
        title: feedback.title,
        message: feedback.message,
        points: feedback.points,
        footer: feedback.footer
      }, { onConflict: 'player_id' });

    if (error) alert('Error: ' + error.message);
    else alert(`Mensaje para ${selectedPlayer.full_name} guardado con éxito.`);
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

  const filteredPlayers = players.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
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
              {categoriesList.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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
                <img src={p.avatar_url} alt="" />
                <div className="player-btn-info">
                  <span className="p-name">{p.full_name}</span>
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
                <h2>Editando Mensaje para <span className="text-sky">{selectedPlayer.full_name} (#{selectedPlayer.dorsal})</span></h2>
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
                      onChange={setNewPoint && (e => setNewPoint(e.target.value))}
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
                  Publicar en el Perfil de {selectedPlayer.full_name?.split(' ')[0]}
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
