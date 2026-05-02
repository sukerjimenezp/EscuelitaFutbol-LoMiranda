import React, { useState, useEffect } from 'react';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { Lock, Unlock, Zap, Trophy, Shield, Star, CheckCircle, MessageSquare, Heart } from 'lucide-react';
import './PlayerProfile.css';

import PlayerCard from '../../components/PlayerCard';
import { playersByCategory } from '../../data/mockData';

// Importar imágenes locales desde src/images/avatares
import { useSkins } from '../../data/SkinsContext';

const PlayerProfile = () => {
  const { user, updateUserAvatar } = useAuth();
  const { skins, userSkins, purchaseSkin, loading: skinsLoading } = useSkins();
  const [purchasingId, setPurchasingId] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  
  // 1. Fetch Feedback from Supabase (instead of localStorage)
  const [feedback, setFeedback] = useState({
    title: '¡BUEN TRABAJO!',
    message: `Hola ${user?.full_name?.split(' ')[0] || 'Jugador'}, estamos analizando tu progreso...`,
    points: ['Sigue entrenando duro para ganar puntos', 'Participa en las trivias semanales'],
    footer: '¡A seguir divirtiéndonos!'
  });

    const fetchFeedback = async () => {
      if (user) {
        const { data } = await supabase
          .from('feedback')
          .select('*')
          .eq('player_id', user.id)
          .single();
        if (data) setFeedback(data);
      }
    };

    const fetchRedemptions = async () => {
      if (user) {
        setLoadingRedemptions(true);
        const { data } = await supabase
          .from('user_skins')
          .select('*, skins(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (data) setRedemptions(data);
        setLoadingRedemptions(false);
      }
    };

    fetchFeedback();
    fetchRedemptions();
  }, [user]);

  const fetchRedemptions = async () => {
    if (user) {
      setLoadingRedemptions(true);
      const { data } = await supabase
        .from('user_skins')
        .select('*, skins(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setRedemptions(data);
      setLoadingRedemptions(false);
    }
  };

  const handleEquipSkin = async (skinUrl) => {
    await updateUserAvatar(skinUrl);
    alert('¡Skin equipada con éxito!');
  };

  const handleBuySkin = async (skin) => {
    if (confirm(`¿Quieres comprar a ${skin.name} por ${skin.cost} puntos?`)) {
      setPurchasingId(skin.id);
      const result = await purchaseSkin(skin.id, skin.cost);
      if (result.success) {
        alert('¡Compra exitosa! Ahora puedes equipar esta skin.');
        fetchRedemptions(); // Refresh history
      } else {
        alert('Error: ' + result.error);
      }
      setPurchasingId(null);
    }
  };

  const fifaStats = {
    name: user?.full_name,
    overall: user?.overall || 75,
    position: user?.position || 'MED',
    pace: user?.pace || 70,
    shooting: user?.shooting || 65,
    passing: user?.passing || 72,
    dribbling: user?.dribbling || 70,
    defense: user?.defense || 60,
    physical: user?.physical || 68,
    image: user?.avatar_url
  };

  return (
    <div className="gamer-profile-container">
      
      {/* BANNER PRINCIPAL CON PUNTOS ACUMULADOS */}
      <div className="gamer-profile-banner">
        <div className="banner-left">
          <PlayerCard player={fifaStats} />
        </div>

        <div className="banner-right">
          <div className="gp-user-info">
            <h1>{user?.full_name}</h1>
            <div className="gp-badges">
              <span className="gp-role-badge"><Zap size={16} /> JUGADOR ACTIVO</span>
              <div className="points-display-premium glass">
                <Trophy size={20} className="text-yellow" />
                <span className="points-val">{user?.points || 0}</span>
                <span className="points-lbl">PUNTOS</span>
              </div>
            </div>
          </div>

          <div className="gp-stats-row">
            <div className="gp-stat-box glass">
              <Shield size={24} className="text-sky" />
              <div className="span-col">
                <span className="stat-num">12</span>
                <span className="stat-lbl">PARTIDOS</span>
              </div>
            </div>
            <div className="gp-stat-box glass">
              <TargetIcon size={24} className="text-red" />
              <div className="span-col">
                <span className="stat-num">5</span>
                <span className="stat-lbl">GOLES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: EL PROFE DICE */}
      <div className="coach-feedback-section">
        <div className="coach-feedback-header">
          <MessageSquare size={24} className="text-secondary-400" />
          <h2 className="title-yellow">EL PROFE DICE</h2>
        </div>

        <div className="coach-feedback-card glass">
          <div className="card-top">
            <Star size={20} fill="#fbbf24" color="#fbbf24" />
            <span className="feedback-badge-top">{feedback.title}</span>
          </div>
          <p className="main-coach-msg">{feedback.message}</p>
          <div className="specific-points-list">
            {feedback.points.map((point, index) => (
              <div key={index} className="point-item glass">
                <Heart size={16} fill="#ef4444" color="#ef4444" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARMARIO DE SKINS / TIENDA */}
      <div className="skin-locker-section">
        <div className="locker-header">
          <h2><Star size={24} color="#fbbf24" /> Armario de Skins</h2>
          <p>Usa tus puntos para desbloquear nuevas leyendas.</p>
        </div>

        {skinsLoading ? (
          <div className="loading-locker">Cargando armario...</div>
        ) : (
          <div className="skins-grid">
            {skins.map((skin) => {
              const isOwned = userSkins.includes(skin.id);
              const isEquipped = user?.avatar_url === skin.image_url;
              const canAfford = (user?.points || 0) >= skin.cost;

              return (
                <div 
                  key={skin.id} 
                  className={`skin-card rarity-${skin.rarity} ${isOwned ? 'owned' : 'locked'} ${isEquipped ? 'equipped' : ''}`}
                >
                  <div className="skin-image-container">
                    <img src={skin.image_url} alt={skin.name} />
                    {!isOwned && (
                      <div className="skin-cost-overlay glass">
                        <Trophy size={16} />
                        <span>{skin.cost}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="skin-info">
                    <h3>{skin.name}</h3>
                    <div className="skin-rarity-badge">{skin.rarity.toUpperCase()}</div>
                    
                    {isOwned ? (
                      <button 
                        className={`equip-btn ${isEquipped ? 'active' : ''}`}
                        onClick={() => handleEquipSkin(skin.image_url)}
                        disabled={isEquipped}
                      >
                        {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                      </button>
                    ) : (
                      <button 
                        className={`buy-btn ${canAfford ? 'affordable' : 'expensive'}`}
                        onClick={() => handleBuySkin(skin)}
                        disabled={!canAfford || purchasingId === skin.id}
                      >
                        {purchasingId === skin.id ? 'COMPRANDO...' : canAfford ? 'COMPRAR' : 'FALTAN PUNTOS'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORIAL DE CANJES */}
      <div className="redemptions-history-section glass mb-8">
        <div className="locker-header">
          <h2><CheckCircle size={24} className="text-sky" /> Mis Canjes</h2>
          <p>Historial de recompensas desbloqueadas con tus puntos.</p>
        </div>

        <div className="redemptions-list">
          {loadingRedemptions ? (
            <div className="loading-locker">Cargando historial...</div>
          ) : redemptions.length > 0 ? (
            <div className="redemptions-table-wrapper">
              <table className="redemptions-table">
                <thead>
                  <tr>
                    <th>Skin</th>
                    <th>Costo</th>
                    <th>Fecha de Canje</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((red) => (
                    <tr key={red.id}>
                      <td className="red-skin-cell">
                        <img src={red.skins?.image_url} alt="" className="red-mini-avatar" />
                        <span>{red.skins?.name}</span>
                      </td>
                      <td>
                        <div className="red-points">
                          <Trophy size={14} className="text-yellow" />
                          {red.skins?.cost}
                        </div>
                      </td>
                      <td>{new Date(red.created_at).toLocaleDateString()}</td>
                      <td><span className="status-unlocked">DESBLOQUEADO</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-redemptions">
              <Zap size={48} className="text-muted" />
              <p>Aún no has canjeado tus puntos por ninguna skin.</p>
              <small>¡Entrena y participa para ganar puntos!</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Necesitaba un componente target extra para el icono de goles
const TargetIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

export default PlayerProfile;
