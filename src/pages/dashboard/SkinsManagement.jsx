import React, { useState } from 'react';
import { useSkins } from '../../data/SkinsContext';
import { Plus, Trash2, Trophy, Image as ImageIcon, Save, X, Star, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SkinsManagement.css';

const SkinsManagement = () => {
  const { skins, addSkinAdmin, updateSkinAdmin, deleteSkinAdmin, loading } = useSkins();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newSkin, setNewSkin] = useState({
    name: '',
    cost: 100,
    rarity: 'rare',
    image_url: ''
  });

  const handleSave = async () => {
    if (!newSkin.name || !newSkin.image_url) {
      return alert('Por favor, completa todos los campos.');
    }
    
    const finalUrl = newSkin.image_url.startsWith('http') || newSkin.image_url.startsWith('/') 
      ? newSkin.image_url 
      : `/images/avatares/${newSkin.image_url}`;

    const skinToSave = { ...newSkin, image_url: finalUrl };

    if (editingId) {
      const { error } = await updateSkinAdmin(editingId, skinToSave);
      if (error) alert(error.message);
      else alert('Recompensa actualizada.');
    } else {
      const { error } = await addSkinAdmin(skinToSave);
      if (error) alert(error.message);
      else alert('Nueva skin añadida con éxito.');
    }

    setShowModal(false);
    setEditingId(null);
    setNewSkin({ name: '', cost: 100, rarity: 'rare', image_url: '' });
  };

  const handleEdit = (skin) => {
    setEditingId(skin.id);
    setNewSkin({
      name: skin.name,
      cost: skin.cost,
      rarity: skin.rarity,
      image_url: skin.image_url
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewSkin({ name: '', cost: 100, rarity: 'rare', image_url: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta recompensa?')) {
      await deleteSkinAdmin(id);
    }
  };

  if (loading) return <div className="loading-skins glass">Cargando catálogo...</div>;

  return (
    <div className="skins-management-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Recompensas</span></h1>
          <p className="dash-subtitle">Crea nuevos avatares y define su costo en puntos para los alumnos.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          Nueva Recompensa
        </button>
      </div>

      <div className="skins-admin-grid">
        {skins.map((skin) => (
          <div key={skin.id} className={`skin-admin-card rarity-${skin.rarity} glass`}>
            <div className="skin-preview">
              <img src={skin.image_url} alt={skin.name} />
              <div className="rarity-tag">{skin.rarity.toUpperCase()}</div>
            </div>
            <div className="skin-details">
              <h3>{skin.name}</h3>
              <div className="cost-badge">
                <Trophy size={14} className="text-yellow" />
                <span>{skin.cost} Puntos</span>
              </div>
            </div>
            <div className="skin-actions">
              <button className="edit-btn" onClick={() => handleEdit(skin)} title="Editar">
                <Edit2 size={18} />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(skin.id)} title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => {setShowModal(false); setEditingId(null);}}>
            <motion.div 
              className="player-modal glass skin-form-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Cargar Nueva <span className="text-sky">Recompensa</span></h2>
                <button className="close-btn" onClick={() => {setShowModal(false); setEditingId(null);}}><X size={24} /></button>
              </div>

              <div className="modal-body single-col">
                <div className="player-form">
                  <div className="field">
                    <label>Nombre del Personaje / Sticker</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Marcelo Salas (Clásico)"
                      value={newSkin.name}
                      onChange={e => setNewSkin({...newSkin, name: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Rareza</label>
                      <select value={newSkin.rarity} onChange={e => setNewSkin({...newSkin, rarity: e.target.value})}>
                        <option value="common">Común</option>
                        <option value="rare">Raro / Pro</option>
                        <option value="epic">Épico</option>
                        <option value="legendary">Legendario</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Costo en Puntos</label>
                      <input 
                        type="number" 
                        value={newSkin.cost}
                        onChange={e => setNewSkin({...newSkin, cost: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Nombre de Archivo o URL de Imagen</label>
                    <input 
                      type="text" 
                      placeholder="Ej: salas.png o https://..."
                      value={newSkin.image_url}
                      onChange={e => setNewSkin({...newSkin, image_url: e.target.value})}
                    />
                  </div>

                  <button className="btn-primary save-action" onClick={handleSave}>
                    <Save size={18} />
                    Publicar Sticker
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

export default SkinsManagement;
