import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import { Users, Briefcase, Plus, X, Save, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CategoriesDash.css';

const CategoriesDash = () => {
  const { user, isAdmin, isDT } = useAuth();
  const canEdit = isAdmin || isDT;

  const [categoriesList, setCategoriesList] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCat, setCurrentCat] = useState({
    id: '',
    name: '',
    label: 'Infantil',
    age_range: '9-10 años',
    color: '#38bdf8'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: profs }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('profiles').select('id, role, category_id')
      ]);
      
      if (cats) setCategoriesList(cats);
      if (profs) setProfiles(profs);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setIsEditing(false);
    setCurrentCat({
      id: `new_${Date.now()}`,
      name: '',
      label: '',
      age_range: '',
      color: '#38bdf8'
    });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setIsEditing(true);
    setCurrentCat({ ...cat });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentCat.name) return alert('Debes ingresar un nombre para la categoría');
    
    // Si es nueva, podemos generar un ID simple basado en el nombre, si no, conservar el que pusimos temporal
    const idToSave = isEditing ? currentCat.id : currentCat.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const { error } = await supabase.from('categories').upsert({
      id: idToSave || currentCat.id,
      name: currentCat.name,
      label: currentCat.label,
      age_range: currentCat.age_range,
      color: currentCat.color
    });

    if (error) {
      alert('Error al guardar la categoría: ' + error.message);
      // It might fail if RLS policy for 'categories' isn't allowing DT.
    } else {
      setShowModal(false);
      fetchData();
    }
  };

  return (
    <div className="categories-dash">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Categorías</span></h1>
          <p className="dash-subtitle">Configura los equipos y asigna el cuerpo técnico por edades.</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            Nueva Categoría
          </button>
        )}
      </div>

      {loading ? (
        <div className="profiles-loading">
          <div className="spinner"></div>
          <p>Cargando categorías...</p>
        </div>
      ) : (
        <div className="cat-grid">
          {categoriesList.map(cat => {
            const catPlayers = profiles.filter(p => p.category_id === cat.id && p.role === 'player');
            const catStaff = profiles.filter(p => p.category_id === cat.id && (p.role === 'dt' || p.role === 'superadmin'));
            
            return (
              <div key={cat.id} className="cat-dash-card glass">
                <div className="cat-card-header" style={{ borderLeftColor: cat.color }}>
                  <div className="cat-info">
                    <h3>{cat.name}</h3>
                    <span className="cat-label" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                  <div className="cat-age-badge">{cat.age_range}</div>
                </div>

                <div className="cat-card-body">
                  <div className="cat-stat">
                    <Users size={16} className="text-muted" />
                    <span>{catPlayers.length} Jugadores Inscritos</span>
                  </div>
                  <div className="cat-stat">
                    <Briefcase size={16} className="text-muted" />
                    <span>{catStaff.length > 0 ? `${catStaff.length} DT/Asistentes` : 'Sin Staff asignado'}</span>
                  </div>
                </div>

                <div className="cat-card-footer">
                  <button className="btn-outline">Gestionar Plantilla</button>
                  {canEdit && (
                    <button className="btn-outline" onClick={() => openEditModal(cat)}>Editar Info</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear/Editar Categoría */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="player-modal glass cat-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>{isEditing ? 'Editar' : 'Nueva'} <span className="text-sky">Categoría</span></h2>
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>

              <div className="modal-body single-col">
                <div className="player-form">
                  <div className="form-row">
                    <div className="field">
                      <label>Nombre de Categoría</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Sub-18"
                        value={currentCat.name}
                        onChange={(e) => setCurrentCat({...currentCat, name: e.target.value.substring(0, 50)})}
                        maxLength={50}
                      />
                    </div>
                    <div className="field">
                      <label>Etapa / Etiqueta</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Juvenil, Mini, etc."
                        value={currentCat.label || ''}
                        onChange={(e) => setCurrentCat({...currentCat, label: e.target.value.substring(0, 30)})}
                        maxLength={30}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Rango de Edad</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 17-18 años"
                        value={currentCat.age_range || ''}
                        onChange={(e) => setCurrentCat({...currentCat, age_range: e.target.value.substring(0, 30)})}
                        maxLength={30}
                      />
                    </div>
                    <div className="field">
                      <label>Color de Equipo</label>
                      <div className="color-picker-input">
                        <input 
                          type="color" 
                          value={currentCat.color || '#cccccc'}
                          onChange={(e) => setCurrentCat({...currentCat, color: e.target.value})}
                        />
                        <span style={{ color: currentCat.color, fontWeight: 700 }}>{(currentCat.color || '').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {!isEditing && (
                    <p style={{marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8'}}>
                      <Shield size={12} style={{display: 'inline', marginRight:'5px'}} />
                      La visibilidad será para Administradores y Directores Técnicos.
                    </p>
                  )}

                  <button className="btn-primary save-action" onClick={handleSave} style={{ marginTop: '20px' }}>
                    <Save size={18} />
                    {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!loading && (
        <div className="cat-stats-summary glass">
          <div className="summary-item">
            <span className="label">Total Categorías</span>
            <span className="value">{categoriesList.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Jugadores</span>
            <span className="value">{profiles.filter(p => p.role === 'player').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesDash;
