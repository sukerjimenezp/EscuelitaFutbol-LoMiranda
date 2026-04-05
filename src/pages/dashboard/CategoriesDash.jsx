import React, { useState } from 'react';
import { categories as initialCategories, playersByCategory, staff } from '../../data/mockData';
import { Users, Briefcase, ChevronRight, Plus, X, Save, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CategoriesDash.css';

const CategoriesDash = () => {
  const [categoriesList, setCategoriesList] = useState(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    label: 'Infantil',
    ageRange: '9-10 años',
    color: '#38bdf8'
  });

  const handleSave = () => {
    if (!newCat.name) return alert('Debes ingresar un nombre para la categoría');
    
    const categoryToSave = {
      ...newCat,
      id: `new_${Date.now()}`
    };

    setCategoriesList([...categoriesList, categoryToSave]);
    setShowModal(false);
    setNewCat({ name: '', label: 'Infantil', ageRange: '9-10 años', color: '#38bdf8' });
  };

  return (
    <div className="categories-dash">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Categorías</span></h1>
          <p className="dash-subtitle">Configura los equipos y asigna el cuerpo técnico por edades.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      <div className="cat-grid">
        {categoriesList.map(cat => {
          const players = playersByCategory[cat.id] || [];
          const catStaff = staff[cat.id] || [];
          
          return (
            <div key={cat.id} className="cat-dash-card glass">
              <div className="cat-card-header" style={{ borderLeftColor: cat.color }}>
                <div className="cat-info">
                  <h3>{cat.name}</h3>
                  <span className="cat-label" style={{ color: cat.color }}>{cat.label}</span>
                </div>
                <div className="cat-age-badge">{cat.ageRange}</div>
              </div>

              <div className="cat-card-body">
                <div className="cat-stat">
                  <Users size={16} className="text-muted" />
                  <span>{players.length} Jugadores Inscritos</span>
                </div>
                <div className="cat-stat">
                  <Briefcase size={16} className="text-muted" />
                  <span>{catStaff.length > 0 ? `${catStaff.length} DT/Asistentes` : 'Sin Staff asignado'}</span>
                </div>
              </div>

              <div className="cat-card-footer">
                <button className="btn-outline">Gestionar Plantilla</button>
                <button className="btn-outline">Editar Info</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Categoría */}
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
                <h2>Nueva <span className="text-sky">Categoría</span></h2>
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
                        value={newCat.name}
                        onChange={(e) => setNewCat({...newCat, name: e.target.value})}
                      />
                    </div>
                    <div className="field">
                      <label>Etapa / Etiqueta</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Juvenil, Mini, etc."
                        value={newCat.label}
                        onChange={(e) => setNewCat({...newCat, label: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Rango de Edad</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 17-18 años"
                        value={newCat.ageRange}
                        onChange={(e) => setNewCat({...newCat, ageRange: e.target.value})}
                      />
                    </div>
                    <div className="field">
                      <label>Color de Equipo</label>
                      <div className="color-picker-input">
                        <input 
                          type="color" 
                          value={newCat.color}
                          onChange={(e) => setNewCat({...newCat, color: e.target.value})}
                        />
                        <span style={{ color: newCat.color, fontWeight: 700 }}>{newCat.color.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary save-action" onClick={handleSave} style={{ marginTop: '20px' }}>
                    <Save size={18} />
                    Crear Categoría
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="cat-stats-summary glass">
        <div className="summary-item">
          <span className="label">Total Categorías</span>
          <span className="value">{categoriesList.length}</span>
        </div>
        <div className="summary-item">
          <span className="label">Promedio Edad</span>
          <span className="value">11.5 años</span>
        </div>
        <div className="summary-item">
          <span className="label">Capacidad de Campo</span>
          <span className="value">95%</span>
        </div>
      </div>
    </div>
  );
};

export default CategoriesDash;
