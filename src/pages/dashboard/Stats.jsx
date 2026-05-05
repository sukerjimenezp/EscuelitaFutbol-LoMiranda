import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { Search, Trophy, Shield, Star, Zap, Target, Activity, MessageCircle, Heart, Medal, Flame, Users } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import jerseyImg from '../../images/camiseta-transparente.png';
import { showToast } from '../../components/Toast';
import './Stats.css';

const SkillBar = ({ label, value, icon: Icon, color }) => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    // Retrasar animación levemente para un efecto progresivo
    const timer = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="skill-bar-container">
      <div className="skill-header">
        <span className="skill-label" style={{ color }}><Icon size={18} /> {label}</span>
        <span className="skill-value" style={{ color }}>{value}</span>
      </div>
      <div className="progress-bg">
        <div 
          className="progress-fill" 
          style={{ width: `${width}%`, backgroundColor: color }} 
        />
      </div>
    </div>
  );
};
const Stats = () => {
  const { user, isPlayer, isParent } = useAuth();
  
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'player');
        
        if (selectedCat !== 'all') {
          query = query.eq('category_id', selectedCat);
        }

        const { data } = await query;
        
        if (data) {
          const adapted = data.map(p => ({
            ...p,
            name: p.full_name,
            image: p.avatar_url || `https://api.dicebear.com/7.x/lorelei/svg?seed=${p.full_name}`
          }));
          setPlayers(adapted);
          
          // Selección inteligente: Priorizar al usuario logeado si es jugador
          if (adapted.length > 0) {
            const myProfile = adapted.find(p => p.id === user?.id);
            if (isPlayer && myProfile) {
              setSelectedPlayer(myProfile);
            } else if (!selectedPlayer) {
              setSelectedPlayer(adapted[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [selectedCat]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (isPlayer || isParent) {
        // En modo jugador/padre, solo mostramos a sí mismos o sus pupilos
        // (Aunque el backend debería filtrar esto, aquí hacemos un extra check si se desea)
        return matchesSearch; 
      }
      return matchesSearch;
    });
  }, [players, searchTerm, isPlayer, isParent]);

  useEffect(() => {
    if (filteredPlayers.length > 0) {
      const myProfile = filteredPlayers.find(p => p.id === user?.id);
      if (isPlayer && myProfile) {
        setSelectedPlayer(myProfile);
      } else if (!selectedPlayer) {
        setSelectedPlayer(filteredPlayers[0]);
      }
    }
  }, [isPlayer, filteredPlayers, user?.id]);

  const advancedStats = useMemo(() => {
    if(!selectedPlayer) return null;
    const base = selectedPlayer.overall;
    
    return {
      dtNotes: [
        "¡Excelente esfuerzo corriendo en la cancha! 🏃‍♂️",
        "Trata de levantar más la cabeza al pasar el balón 👀",
        "Me gusta mucho tu actitud de compañerismo 🤝"
      ]
    };
  }, [selectedPlayer]);


  return (
    <div className="kid-stats-dashboard">
      
      {/* Sidebar de Selección */}
      {!(isPlayer || (isParent && filteredPlayers.length <= 1)) && (
        <div className="kid-sidebar glass-panel">
          <h2 className="kid-sidebar-title">Equipos ⚽</h2>
          
          <div className="kid-filters">
            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
              {categoriesList.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            
            <div className="kid-search-box">
              <Search size={18} />
              <input type="text" placeholder="Buscar amigo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="kid-player-grid">
            {filteredPlayers.map(p => (
              <div 
                key={p.id} 
                className={`kid-player-card ${selectedPlayer?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPlayer(p)}
              >
                <div className="avatar-wrapper">
                  <img src={p.image} alt={p.name} />
                  <span className="mini-overall">{p.overall}</span>
                </div>
                <strong>{p.name.split(' ')[0]}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjeta de Estadísticas Principal (Playful Layout) */}
      <div className="kid-main-panel">
        {selectedPlayer && advancedStats ? (
          <div className="kid-hero-card">
            
            {/* Header del Perfil */}
            <div className="kid-hero-header">
              <div className="p-info">
                <h1>{selectedPlayer.name}</h1>
                <div className="p-badges">
                  <span className="position-badge"><Star size={16} /> {selectedPlayer.position}</span>
                  <span className="season-badge">TEMPORADA 2026</span>
                </div>
              </div>
              <div className="p-logo">
                <img src={logo} alt="Club Local" />
              </div>
            </div>

            <div className="kid-hero-content">
              
              {/* Columna Izquierda: Skills Mágicos */}
              <div className="kid-skills-col">
                <h3 className="section-title"><Activity size={24} /> PUNTOS DE HABILIDAD</h3>
                <div className="skills-container">
                  <SkillBar label="Velocidad" value={selectedPlayer.pace} icon={Zap} color="#f59e0b" />
                  <SkillBar label="Tiro a Puerta" value={selectedPlayer.shooting} icon={Target} color="#ef4444" />
                  <SkillBar label="Pases" value={selectedPlayer.passing} icon={Activity} color="#3b82f6" />
                  <SkillBar label="Regate Mágico" value={selectedPlayer.dribbling} icon={Star} color="#a855f7" />
                  <SkillBar label="Defensa Fuerte" value={selectedPlayer.defense} icon={Shield} color="#10b981" />
                  <SkillBar label="Energía" value={selectedPlayer.physical} icon={Flame} color="#f97316" />
                </div>
              </div>

              {/* Columna Central: Uniforme Elevado */}
              <div className="kid-center-col">
                <div className="spotlight-bg"></div>
                <div className="kit-wrapper">
                  <img src={jerseyImg} alt="Kit Oficial" className="floating-kit" />
                </div>
                
                <div className="overall-badge bounce">
                  <span className="o-label">NIVEL</span>
                  <span className="o-val">{selectedPlayer.overall}</span>
                </div>
              </div>

              {/* Columna Derecha: Mensajes del DT (Rediseñada estilo Chat) */}
              <div className="kid-feedback-col">
                <div className="coach-feedback-container vertical-mode">
                  <div className="coach-avatar-wrapper">
                    <div className="coach-avatar-circle">
                      <Users size={32} color="white" />
                      <div className="online-indicator"></div>
                    </div>
                    <span className="coach-name">EL PROFE</span>
                  </div>

                  <div className="coach-bubble glass highlight-border">
                    <div className="bubble-header">
                      <Trophy size={18} fill="#fbbf24" color="#fbbf24" />
                      <span className="bubble-title">¡Buen Trabajo!</span>
                    </div>
                    
                    <p className="bubble-text">"Hola {selectedPlayer.name.split(' ')[0]}, vi tus últimos partidos y miedos en la cancha, ¡has mejorado mucho!"</p>
                    
                    <div className="missions-grid stats-mode">
                      {advancedStats.dtNotes.map((note, i) => (
                        <div key={i} className="mission-item glass">
                          <div className="mission-icon">
                            <Heart size={14} fill="#ef4444" color="#ef4444" />
                          </div>
                          <span className="mission-text">{note}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="dt-signature">
                      <Medal size={16} /> ¡A seguir divirtiéndonos!
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

          </div>
        ) : (
          <div className="kid-empty-state text-muted">Selecciona un amigo para ver sus superpoderes.</div>
        )}
      </div>

    </div>
  );
};

export default Stats;
