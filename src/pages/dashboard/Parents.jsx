import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Trash2, 
  X,
  XCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showToast, showConfirm } from '../../components/Toast';
import './Players.css'; // Reutilizamos estilos de Players

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchParents = useCallback(async () => {
    setLoading(true);
    
    // 1. Obtener todos los apoderados
    const { data: parentsData, error: parentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .order('full_name');
      
    if (parentsError) {
      console.error('Error fetching parents:', parentsError);
      setLoading(false);
      return;
    }

    // 2. Obtener todos los jugadores para mapear los hijos
    const { data: playersData, error: playersError } = await supabase
      .from('profiles')
      .select('id, full_name, parent_id')
      .eq('role', 'player')
      .not('parent_id', 'is', null);

    if (playersError) {
      console.error('Error fetching players for parents:', playersError);
    }

    // 3. Cruzar datos
    const parentsWithChildren = (parentsData || []).map(parent => {
      const children = (playersData || []).filter(p => p.parent_id === parent.id);
      return { ...parent, children };
    });

    setParents(parentsWithChildren);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleDeleteParent = async (parentId, childrenCount) => {
    let confirmMessage = '¿Estás seguro de eliminar a este apoderado?';
    if (childrenCount > 0) {
      confirmMessage = `Este apoderado tiene ${childrenCount} jugador(es) asociado(s). Si lo eliminas, los jugadores quedarán "Sin apoderado". ¿Estás seguro?`;
    }

    showConfirm(confirmMessage, async () => {
      setDeletingId(parentId);
      try {
        // 1. Desvincular jugadores (poner parent_id = null)
        const { error: unlinkError } = await supabase
          .from('profiles')
          .update({ parent_id: null })
          .eq('parent_id', parentId);
          
        if (unlinkError) throw unlinkError;

        // 2. Eliminar de profiles
        // NOTA: Como la API de auth.users no es accesible por el cliente para borrar, 
        // borrarlo de profiles es suficiente. El sistema anti-colisiones manejará si vuelve a registrarse.
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', parentId);

        if (deleteError) throw deleteError;

        showToast('Apoderado eliminado correctamente', 'success');
        fetchParents();
      } catch (err) {
        console.error('Error eliminando apoderado:', err);
        showToast('Error al eliminar apoderado: ' + err.message, 'error');
      } finally {
        setDeletingId(null);
      }
    });
  };

  const filteredParents = parents.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="players-config-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Apoderados</span></h1>
          <p className="dash-subtitle">Administra los apoderados y sus jugadores asociados</p>
        </div>
        <div className="search-input-wrapper" style={{ marginTop: '10px' }}>
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="players-list-container glass">
        <div className="list-header" style={{ gridTemplateColumns: '2fr 2fr 3fr 1fr' }}>
          <div className="col-player">Apoderado</div>
          <div className="col-contact">Contacto / Usuario</div>
          <div className="col-children">Jugadores Asociados</div>
          <div className="col-actions">Acciones</div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={24} className="spin-icon" style={{ color: 'var(--text-muted)' }} />
            <p>Cargando apoderados...</p>
          </div>
        ) : filteredParents.length > 0 ? (
          <div className="list-body">
            {filteredParents.map(parent => (
              <div key={parent.id} className="player-row" style={{ gridTemplateColumns: '2fr 2fr 3fr 1fr' }}>
                <div className="col-player">
                  <img src={parent.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(parent.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`} alt={parent.full_name} className="row-avatar" />
                  <span className="player-name">{parent.full_name}</span>
                </div>
                <div className="col-contact" style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>{parent.email}</span>
                  <small style={{ color: 'var(--text-muted)' }}>{parent.phone || 'Sin teléfono'}</small>
                </div>
                <div className="col-children" style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  {parent.children.length > 0 ? (
                    parent.children.map(child => (
                      <span key={child.id} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={12} className="text-sky" /> {child.full_name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin jugadores asociados</span>
                  )}
                </div>
                <div className="col-actions">
                  <button 
                    className="icon-btn delete" 
                    title="Eliminar" 
                    onClick={() => handleDeleteParent(parent.id, parent.children.length)}
                    disabled={deletingId === parent.id}
                  >
                    {deletingId === parent.id ? <RefreshCw size={16} className="spin-icon" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No se encontraron apoderados registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Parents;
