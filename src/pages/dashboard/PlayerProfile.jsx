import React, { useState, useEffect } from 'react';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { Lock, Unlock, Zap, Trophy, Shield, Star, CheckCircle, MessageSquare, Heart, RefreshCw } from 'lucide-react';
import { showToast, showConfirm } from '../../components/Toast';
import './PlayerProfile.css';

import PlayerCard from '../../components/PlayerCard';

// PERF-06 FIX: Removed unused mockData import (migrated to Supabase)
import { useSkins } from '../../data/SkinsContext';

const PlayerProfile = ({ playerId }) => {
  const { user: authUser, updateUserAvatar } = useAuth();
  const { skins, userSkins: authUserSkins, purchaseSkin, loading: skinsLoading } = useSkins();
  
  const [targetUser, setTargetUser] = useState(null);
  const [targetUserSkins, setTargetUserSkins] = useState([]);
  const [purchasingId, setPurchasingId] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [feedback, setFeedback] = useState({
    title: '¡BUEN TRABAJO!',
    message: 'Estamos analizando el progreso...',
    points: ['Sigue entrenando duro para ganar puntos', 'Participa en las trivias semanales'],
    footer: '¡A seguir divirtiéndonos!'
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setProfileLoading(true);
      const effectiveId = playerId || authUser?.id;
      const readOnly = !!playerId && playerId !== authUser?.id;
      setIsReadOnly(readOnly);

      if (!effectiveId) {
        setProfileLoading(false);
        return;
      }

      try {
        // 1. Fetch User Profile
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', effectiveId)
          .single();
        
        if (pData) setTargetUser(pData);

        // 2. Fetch Feedback
        const { data: fData } = await supabase
          .from('feedback')
          .select('*')
          .eq('player_id', effectiveId)
          .single();
        if (fData) setFeedback(fData);

        // 3. Fetch Skins owned by this player
        const { data: sData } = await supabase
          .from('user_skins')
          .select('*, skins(*)')
          .eq('user_id', effectiveId)
          .order('created_at', { ascending: false });
        
        if (sData) {
          setRedemptions(sData);
          setTargetUserSkins(sData.map(s => s.skin_id));
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setProfileLoading(false);
        setLoadingRedemptions(false);
      }
    };

    loadProfileData();
  }, [playerId, authUser]);

  const handleEquipSkin = async (skinUrl) => {
    if (isReadOnly) return;
    await updateUserAvatar(skinUrl);
    setTargetUser(prev => ({ ...prev, avatar_url: skinUrl }));
    showToast('¡Skin equipada con éxito!', 'success');
  };

  const handleBuySkin = async (skin) => {
    if (isReadOnly) return;
    showConfirm(`¿Quieres comprar a ${skin.name} por ${skin.cost} puntos?`, async () => {
      setPurchasingId(skin.id);
      const result = await purchaseSkin(skin.id, skin.cost);
      if (result.success) {
        showToast('¡Compra exitosa! Ahora puedes equipar esta skin.', 'success');
        // Refresh redemptions
        const { data: sData } = await supabase
          .from('user_skins')
          .select('*, skins(*)')
          .eq('user_id', targetUser.id);
        if (sData) {
          setRedemptions(sData);
          setTargetUserSkins(sData.map(s => s.skin_id));
        }
      } else {
        showToast('Error: ' + result.error, 'error');
      }
      setPurchasingId(null);
    });
  };

  if (profileLoading) {
    return (
      <div className="gamer-profile-container" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'400px' }}>
        <RefreshCw size={32} className="spin-icon text-sky" />
        <p style={{ marginLeft: '10px' }}>Cargando perfil...</p>
      </div>
    );
  }

  const displayUser = targetUser || authUser;

  const fifaStats = {
    name: displayUser?.full_name,
    overall: displayUser?.overall || 75,
    position: displayUser?.position || 'MED',
    pace: displayUser?.pace || 70,
    shooting: displayUser?.shooting || 65,
    passing: displayUser?.passing || 72,
    dribbling: displayUser?.dribbling || 70,
    defense: displayUser?.defense || 60,
    physical: displayUser?.physical || 68,
    image: displayUser?.avatar_url
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
            <h1>{displayUser?.full_name}</h1>
            <div className="gp-badges">
              <span className="gp-role-badge"><Zap size={16} /> JUGADOR ACTIVO</span>
              <div className="points-display-premium glass">
                <Trophy size={20} className="text-yellow" />
                <span className="points-val">{displayUser?.points || 0}</span>
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
            {feedback.points && feedback.points.map((point, index) => (
              <div key={index} className="point-item glass">
                <Heart size={16} fill="#ef4444" color="#ef4444" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARMARIO DE SKINS / TIENDA (Solo si no es modo lectura) */}
      <div className="skin-locker-section">
        <div className="locker-header">
          <h2><Star size={24} color="#fbbf24" /> Armario de Skins</h2>
          <p>{isReadOnly ? 'Skins desbloqueadas por el jugador.' : 'Usa tus puntos para desbloquear nuevas leyendas.'}</p>
        </div>

        {skinsLoading ? (
          <div className="loading-locker">Cargando armario...</div>
        ) : (
          <div className="skins-grid">
            {skins.map((skin) => {
              const isOwned = targetUserSkins.includes(skin.id);
              const isEquipped = displayUser?.avatar_url === skin.image_url;
              const canAfford = (displayUser?.points || 0) >= skin.cost;

              // Si es lectura, solo mostrar las que TIENE
              if (isReadOnly && !isOwned) return null;

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
                    
                    {!isReadOnly && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {isReadOnly && targetUserSkins.length === 0 && (
              <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>Este jugador no tiene skins adicionales aún.</p>
            )}
          </div>
        )}
      </div>

      {/* HISTORIAL DE CANJES */}
      <div className="redemptions-history-section glass mb-8">
        <div className="locker-header">
          <h2><CheckCircle size={24} className="text-sky" /> {isReadOnly ? 'Canjes Realizados' : 'Mis Canjes'}</h2>
          <p>Historial de recompensas desbloqueadas.</p>
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
              <p>{isReadOnly ? 'Este jugador aún no ha realizado canjes.' : 'Aún no has canjeado tus puntos por ninguna skin.'}</p>
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
