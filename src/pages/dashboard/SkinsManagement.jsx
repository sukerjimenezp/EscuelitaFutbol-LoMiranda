import React, { useState } from 'react';
import { useSkins } from '../../data/SkinsContext';
import { Plus, Trash2, Trophy, Image as ImageIcon, Save, X, Star, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SkinsManagement.css';

const SkinsManagement = () => {
  const { skins, addSkin, deleteSkin, updateSkin } = useSkins();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newSkin, setNewSkin] = useState({
    name: '',
    condition: '',
    rarity: 'rare',
    url: ''
  });

  const handleEdit = (skin) => {
    setEditingId(skin.id);
    let displayUrl = skin.url;
    // Si es una ruta local de src, mostramos solo el nombre del archivo para facilitar edición
    if (displayUrl.startsWith('/src/images/avatares/')) {
      displayUrl = displayUrl.replace('/src/images/avatares/', '');
    }
    
    setNewSkin({
      name: skin.name,
      condition: skin.condition,
      rarity: skin.rarity,
      url: displayUrl
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!newSkin.name || !newSkin.condition || !newSkin.url) {
      return alert('Por favor, completa todos los campos.');
    }
    
    const finalUrl = newSkin.url.startsWith('http') || newSkin.url.startsWith('/') 
      ? newSkin.url 
      : `/src/images/avatares/${newSkin.url}`;

    if (editingId) {
      updateSkin(editingId, { ...newSkin, url: finalUrl });
      alert('Skin actualizada con éxito.');
    } else {
      addSkin({ ...newSkin, url: finalUrl });
      alert('Nueva skin añadida con éxito.');
    }

    setShowModal(false);
    setEditingId(null);
    setNewSkin({ name: '', condition: '', rarity: 'rare', url: '' });
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewSkin({ name: '', condition: '', rarity: 'rare', url: '' });
    setShowModal(true);
  };

  return (
    <div className="skins-management-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Recompensas</span></h1>
          <p className="dash-subtitle">Crea nuevos avatares y define los logros necesarios para obtenerlos.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          Nueva Skin / Logro
        </button>
      </div>

      <div className="skins-admin-grid">
        {skins.map((skin) => (
          <div key={skin.id} className={`skin-admin-card rarity-${skin.rarity} glass`}>
            <div className="skin-preview">
              <img src={skin.url} alt={skin.name} />
              <div className="rarity-tag">{skin.rarity.toUpperCase()}</div>
            </div>
            <div className="skin-details">
              <h3>{skin.name}</h3>
              <p className="condition-text">
                <Trophy size={14} className="text-sky" />
                {skin.condition}
              </p>
            </div>
            <div className="skin-actions">
              <button className="icon-btn-edit" onClick={() => handleEdit(skin)} title="Editar">
                <Edit2 size={18} />
              </button>
              <button className="delete-btn" onClick={() => deleteSkin(skin.id)} title="Eliminar">
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
                <h2>{editingId ? 'Editar' : 'Cargar Nueva'} <span className="text-sky">Recompensa</span></h2>
                <button className="close-btn" onClick={() => {setShowModal(false); setEditingId(null);}}><X size={24} /></button>
              </div>

              <div className="modal-body single-col">
                <div className="player-form">
                  <div className="field">
                    <label>Nombre del Personaje / Skin</label>
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
                      <label>Nombre de Archivo en /images/avatares</label>
                      <input 
                        type="text" 
                        placeholder="Ej: salas_98.png"
                        value={newSkin.url}
                        onChange={e => setNewSkin({...newSkin, url: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Logro / Condición para Desbloqueo</label>
                    <textarea 
                      placeholder="Ej: Completar el 100% de asistencia este mes"
                      value={newSkin.condition}
                      onChange={e => setNewSkin({...newSkin, condition: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="info-box-alert glass">
                    <Star size={18} className="text-sky" />
                    <p>Asegúrate de que el archivo de imagen esté en la carpeta <strong>src/images/avatares</strong>.</p>
                  </div>

                  <button className="btn-primary save-action" onClick={handleSave}>
                    <Save size={18} />
                    {editingId ? 'Guardar Cambios' : 'Publicar Skin'}
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
