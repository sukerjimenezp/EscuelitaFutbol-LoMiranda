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
  
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para no saturar la base de datos (Max 300x300)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 WebP (alta compresión)
        const base64Url = canvas.toDataURL('image/webp', 0.8);
        setNewSkin({ ...newSkin, image_url: base64Url });
        setUploadingImage(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!newSkin.name || !newSkin.image_url) {
      return alert('Por favor, completa todos los campos.');
    }
    
    const skinToSave = { ...newSkin };

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
      const { error } = await deleteSkinAdmin(id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
      } else {
        alert('Recompensa eliminada exitosamente.');
      }
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
              className="event-modal glass skin-form-modal" 
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
                    <label>Imagen del Sticker</label>
                    <div className="image-upload-area">
                      {newSkin.image_url ? (
                        <div className="image-preview" style={{position: 'relative', width: '120px', height: '120px', margin: '0 auto', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                          <img src={newSkin.image_url} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                          <button 
                            className="remove-image-btn" 
                            style={{position: 'absolute', top: 5, right: 5, background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}
                            onClick={(e) => { e.preventDefault(); setNewSkin({...newSkin, image_url: ''}); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="upload-btn glass" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '25px', cursor: 'pointer', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center'}}>
                          {uploadingImage ? (
                            <span style={{color: 'var(--sky-blue)'}}>Procesando...</span>
                          ) : (
                            <>
                              <ImageIcon size={32} style={{opacity: 0.5, marginBottom: '10px'}} />
                              <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Haz clic para seleccionar una imagen desde tu PC</span>
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/webp" 
                                style={{display: 'none'}} 
                                onChange={handleImageUpload}
                              />
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <button className="btn-primary save-action" onClick={handleSave}>
                    <Save size={18} />
                    {editingId ? 'Guardar Cambios' : 'Publicar Sticker'}
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
