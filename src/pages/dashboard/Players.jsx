import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronRight,
  UserPlus,
  X,
  XCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isolatedAuthClient } from '../../lib/supabase';
import { getCategoryByAge } from '../../lib/ageValidator';
import './Players.css';
import { showToast, showConfirm } from '../../components/Toast';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successCredentials, setSuccessCredentials] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  // ── Estado Apoderado ──
  const [parentOption, setParentOption] = useState('none');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [existingParents, setExistingParents] = useState([]);
  
  const [newPlayer, setNewPlayer] = useState({
    full_name: '',
    dorsal: 10,
    position: 'DC',
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defense: 50,
    physical: 50,
    birth_date: ''
  });

  const [overall, setOverall] = useState(50);

  const fetchPlayers = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('role', 'player')
        .order('full_name');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      showToast('Error al cargar jugadores: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const fetchParents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'parent');
    setExistingParents(data || []);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      if (data && data.length > 0) {
        setCategoriesList(data);
        if (!selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const stats = [
      newPlayer.pace, 
      newPlayer.shooting, 
      newPlayer.passing, 
      newPlayer.dribbling, 
      newPlayer.defense, 
      newPlayer.physical
    ];
    const avg = Math.round(stats.reduce((a, b) => a + b, 0) / stats.length);
    setOverall(avg);
  }, [newPlayer]);

  const handleInputChange = (field, value) => {
    setNewPlayer(prev => {
      let sanitizedValue = value;
      if (field === 'full_name') sanitizedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 80);
      if (field === 'dorsal') sanitizedValue = value.toString().substring(0, 2);
      
      const updated = { 
        ...prev, 
        [field]: ['full_name', 'position', 'category_id', 'birth_date', 'avatar_url', 'email'].includes(field) 
          ? sanitizedValue 
          : (parseInt(sanitizedValue) || 0)
      };

      // Si cambia la fecha de nacimiento, sugerimos una categoría automáticamente
      if (field === 'birth_date' && value) {
        updated.category_id = getCategoryByAge(value);
      }

      return updated;
    });
  };

  const handleEditClick = async (player) => {
    try {
      setEditingPlayerId(player.id);
      setNewPlayer({
        ...player
      });
      
      // Intentar cargar apoderados pero no bloquear si falla
      fetchParents().catch(err => console.warn('Error cargando apoderados en edición:', err));
      
      if (player.parent_id) {
        setParentOption('existing');
        setSelectedParentId(player.parent_id);
      } else {
        setParentOption('none');
        setSelectedParentId('');
      }
      setNewParentName('');
      setNewParentPhone('');
      setShowModal(true);
    } catch (err) {
      console.error('Error al abrir editor:', err);
      showToast('Error al abrir el editor', 'error');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    showConfirm('Esta acción eliminará al jugador de forma permanente.', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', playerId)
        .select();
      
      if (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
      } else if (!data || data.length === 0) {
        // Si no retorna data, significa que la política RLS bloqueó el borrado silenciosamente.
        showToast('Permiso denegado: No tienes privilegios para eliminar jugadores.', 'error', 4500);
      } else {
        showToast('Jugador eliminado correctamente', 'success');
        fetchPlayers();
      }
    });
  };

  const handleSave = async () => {
    setFormError('');
    if (!newPlayer.full_name.trim()) {
      setFormError('Debes ingresar el nombre del jugador');
      return;
    }
    
    setSaving(true);
    try {
      const playerToSave = {
        full_name: newPlayer.full_name.trim(),
        dorsal: newPlayer.dorsal,
        position: newPlayer.position,
        overall: overall,
        pace: newPlayer.pace,
        shooting: newPlayer.shooting,
        passing: newPlayer.passing,
        dribbling: newPlayer.dribbling,
        defense: newPlayer.defense,
        physical: newPlayer.physical,
        birth_date: newPlayer.birth_date || null,
        category_id: newPlayer.category_id,
        role: 'player',
        avatar_url: newPlayer.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newPlayer.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`,
        email: newPlayer.email || `${newPlayer.full_name.replace(/\s/g, '').toLowerCase()}@escuela.cl`
      };

      if (editingPlayerId) {
        const { error } = await supabase
          .from('profiles')
          .update(playerToSave)
          .eq('id', editingPlayerId);
        
        if (error) {
          setFormError(error.message);
        } else {
          // Manejar asignación de apoderado
          let parentResult = null;
          try {
            parentResult = await handleParentAssignment(editingPlayerId);
          } catch (parentErr) {
            setFormError('Jugador guardado, pero error con apoderado: ' + parentErr.message);
            fetchPlayers();
            setSaving(false);
            return;
          }

          setShowModal(false);
          let toastMsg = 'Ficha actualizada exitosamente';
          if (parentResult?.isNew) {
            toastMsg += ` | \uD83D\uDC68 Apoderado: ${parentResult.username}@lomiranda.cl / Clave: ${parentResult.password}`;
          } else if (parentResult) {
            toastMsg += ` | \uD83D\uDC68 Vinculado a: ${parentResult.name}`;
          }
          showToast(toastMsg, 'success', parentResult?.isNew ? 8000 : 3000);
          if (playerToSave.category_id !== selectedCategory) {
            setSelectedCategory(playerToSave.category_id);
          } else {
            fetchPlayers();
          }
        }
      } else {
        // ── Validar duplicados antes de insertar ──
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, full_name, category_id')
          .eq('role', 'player')
          .ilike('full_name', playerToSave.full_name);

        if (existing && existing.length > 0) {
          const cat = categoriesList.find(c => c.id === existing[0].category_id);
          setFormError(`El jugador "${existing[0].full_name}" ya está registrado en ${cat?.name || existing[0].category_id}`);
          setSaving(false);
          return;
        }

        // ── Auth: Creación de Cuenta Shadow de Paso ──
        // Para que entren la primera vez y configuren.
        const parts = playerToSave.full_name.trim().split(' ');
        const initial = parts[0].charAt(0).toLowerCase();
        const lastname = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') : parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let rawUsername = `${initial}${lastname}`;
        let tempEmail = `${rawUsername}@lomiranda.cl`;
        let authData = null;
        let authErr = null;
        let finalPassword = '';

        // ── Auth: Creación de Cuenta con Manejo de Colisiones ──
        for (let i = 0; i <= 5; i++) {
          const currentUsername = i === 0 ? rawUsername : `${rawUsername}${i}`;
          tempEmail = `${currentUsername}@lomiranda.cl`;
          // El usuario solicitó que la clave inicial sea exactamente el nombre de usuario final
          finalPassword = currentUsername;
          
          console.log(`[Registration] Intentando Auth: ${tempEmail}`);
          const response = await isolatedAuthClient.auth.signUp({
            email: tempEmail,
            password: finalPassword,
            options: { data: { role: 'player' } }
          });
          
          authData = response.data;
          authErr = response.error;
          
          // Si el error NO es de colisión (o no hay error y no es fake success), rompemos el loop
          const isFakeSuccess = !authErr && (!authData?.user?.identities || authData.user.identities.length === 0);
          if (isFakeSuccess) {
            authErr = { message: 'already registered' };
          }

          if (!authErr || (!authErr.message.includes('already registered') && !authErr.message.includes('already exists'))) {
            rawUsername = currentUsername; // Guardar el que funcionó
            break;
          }
        }

        if (authErr) {
          console.error('[Registration] Error en Auth:', authErr);
          if (authErr.message.includes('already registered') || authErr.message.includes('already exists')) {
             setFormError(`El usuario base "${rawUsername}" ya tiene demasiadas colisiones. Modifica el nombre (ej: agrega un segundo apellido).`);
          } else {
             setFormError('Error de Autenticación: ' + authErr.message);
          }
          setSaving(false);
          return;
        }

        const newUserId = authData?.user?.id;
        console.log('[Registration] Cuenta Auth creada, UUID:', newUserId);

        if (!newUserId) {
          setFormError('No se pudo obtener la ID del usuario nuevo.');
          setSaving(false);
          return;
        }

        // Importante: Guardamos el username temporal en la tabla profiles
        console.log('[Registration] Insertando perfil en BD para:', playerToSave.full_name);
        playerToSave.email = tempEmail;
        const generatedPin = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error } = await supabase
          .from('profiles')
          .upsert([{ 
            id: newUserId, 
            link_pin: generatedPin,
            full_name: playerToSave.full_name,
            role: 'player',
            category_id: playerToSave.category_id,
            dorsal: playerToSave.dorsal,
            position: playerToSave.position,
            pace: playerToSave.pace,
            shooting: playerToSave.shooting,
            passing: playerToSave.passing,
            dribbling: playerToSave.dribbling,
            defense: playerToSave.defense,
            physical: playerToSave.physical,
            birth_date: playerToSave.birth_date,
            email: tempEmail,
            avatar_url: playerToSave.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(playerToSave.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`
          }], { onConflict: 'id' });

        if (error) {
          setFormError(error.message);
        } else {
          // Manejar asignación de apoderado
          let parentResult = null;
          try {
            parentResult = await handleParentAssignment(newUserId);
          } catch (parentErr) {
            showToast(`Jugador creado (${rawUsername}), pero error con apoderado: ${parentErr.message}`, 'warning', 8000);
            resetForm();
            setShowModal(false);
            fetchPlayers();
            setSaving(false);
            return;
          }

          resetForm();
          setShowModal(false);
          
          setSuccessCredentials({
            playerName: playerToSave.full_name,
            playerUsername: rawUsername,
            playerPassword: finalPassword,
            pin: generatedPin,
            parent: parentResult
          });
          
          if (playerToSave.category_id !== selectedCategory) {
            setSelectedCategory(playerToSave.category_id);
          } else {
            fetchPlayers();
          }
        }
      }
    } catch (err) {
      console.error('Error en handleSave:', err);
      setFormError('Error inesperado: ' + err.message + '. Intenta refrescar la página.');
    } finally {
      console.log('[Registration] Finalizando proceso de guardado.');
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setFormError('');
    setNewPlayer({
      full_name: '', 
      dorsal: 10, 
      position: 'DC', 
      pace: 50, 
      shooting: 50, 
      passing: 50, 
      dribbling: 50, 
      defense: 50, 
      physical: 50, 
      birth_date: '',
      category_id: selectedCategory // Pre-seleccionar la categoría actual
    });
    setParentOption('none');
    setSelectedParentId('');
    setNewParentName('');
    setNewParentPhone('');
  };

  // ── Helper: Crear o asignar apoderado a un jugador ──
  const handleParentAssignment = async (playerId) => {
    if (parentOption === 'none') {
      await supabase.from('profiles').update({ parent_id: null }).eq('id', playerId);
      return null;
    }

    if (parentOption === 'existing' && selectedParentId) {
      const { error } = await supabase.from('profiles').update({ parent_id: selectedParentId }).eq('id', playerId);
      if (error) throw error;
      const parent = existingParents.find(p => p.id === selectedParentId);
      return { name: parent?.full_name, isNew: false };
    }

    if (parentOption === 'new' && newParentName.trim()) {
      console.log('[Registration] Creando apoderado nuevo:', newParentName);
      const parts = newParentName.trim().split(' ');
      const initial = parts[0].charAt(0).toLowerCase();
      const lastname = parts.length > 1
        ? parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '')
        : parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let parentUsername = `${initial}${lastname}`;
      let parentTempEmail = `${parentUsername}@lomiranda.cl`;
      let pAuth = null;
      let pAuthErr = null;
      let parentFinalPassword = '';

      // ── Manejo de Colisiones para Apoderado ──
      for (let i = 0; i <= 5; i++) {
        const currentUsername = i === 0 ? parentUsername : `${parentUsername}${i}`;
        parentTempEmail = `${currentUsername}@lomiranda.cl`;
        parentFinalPassword = currentUsername;
        
        console.log('[Registration] Intentando Auth Apoderado:', parentTempEmail);
        const response = await isolatedAuthClient.auth.signUp({
          email: parentTempEmail,
          password: parentFinalPassword,
          options: { data: { role: 'parent' } }
        });
        
        pAuth = response.data;
        pAuthErr = response.error;

        // Detectar colisión con Email Enumeration Protection activado
        const isFakeSuccess = !pAuthErr && (!pAuth?.user?.identities || pAuth.user.identities.length === 0);
        if (isFakeSuccess) {
          pAuthErr = { message: 'already registered' };
        }

        if (!pAuthErr || (!pAuthErr.message.includes('already registered') && !pAuthErr.message.includes('already exists'))) {
          parentUsername = currentUsername;
          break;
        }
      }

      if (pAuthErr) {
        console.error('[Registration] Error Auth apoderado:', pAuthErr);
        if (pAuthErr.message.includes('already registered') || pAuthErr.message.includes('already exists')) {
          throw new Error(`El usuario base "${parentUsername}" ya tiene demasiadas colisiones. Use nombre más específico.`);
        }
        throw pAuthErr;
      }

      const parentId = pAuth?.user?.id;
      console.log('[Registration] Apoderado Auth creado, UUID:', parentId);
      if (!parentId) throw new Error('Error creando cuenta del apoderado.');

      // Usar upsert explícito con onConflict para evitar crash de duplicate key
      const { error: profErr } = await supabase.from('profiles').upsert([{
        id: parentId,
        full_name: newParentName.trim(),
        email: parentTempEmail,
        role: 'parent',
        phone: newParentPhone.trim() || null,
        avatar_url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${newParentName}`
      }], { onConflict: 'id' });
      
      if (profErr) throw profErr;

      await supabase.from('profiles').update({ parent_id: parentId }).eq('id', playerId);
      return { name: newParentName.trim(), username: parentUsername, password: parentFinalPassword, isNew: true };
    }

    return null;
  };

  const filteredPlayers = players.filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="players-config-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Jugadores</span></h1>
          <p className="dash-subtitle">Administra la plantilla y estadísticas de cada categoría.</p>
        </div>
        <button className="btn-primary add-player-btn" onClick={() => { resetForm(); fetchParents(); setShowModal(true); }}>
          <UserPlus size={18} />
          Nuevo Jugador
        </button>
      </div>

      <div className="filters-row glass">
          <div className="filter-group glass">
            <Filter size={18} />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

        <div className="search-input-wrapper">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="players-list-container glass">
        <div className="list-header">
          <div className="col-player">Jugador</div>
          <div className="col-pos">Pos</div>
          <div className="col-dorsal">Dorsal</div>
          <div className="col-stats">PAC / SHO / PAS / DRI / DEF / PHY</div>
          <div className="col-ovr">OVR</div>
          <div className="col-actions">Acciones</div>
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="list-body">
            {filteredPlayers.map(player => (
              <div key={player.id} className="player-row">
                <div className="col-player">
                  <img src={player.avatar_url} alt={player.full_name} className="row-avatar" />
                  <span className="player-name">
                    {player.full_name}
                    {player.link_pin && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginLeft: '8px' }}>
                        <span className="pin-badge" style={{ fontSize: '10px', background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                          PIN: {player.link_pin}
                        </span>
                        <a 
                          href={`https://wa.me/?text=${encodeURIComponent(`⚽ ¡Hola! Te envío los datos de acceso para *${player.full_name}* en la App de la Escuelita Lo Miranda:%0A%0A👤 *Usuario:* ${player.email.split('@')[0]}%0A🔑 *Clave:* ${player.email.split('@')[0]}%0A📌 *PIN de Vinculación:* ${player.link_pin}%0A%0A¡Nos vemos en la cancha!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#25D366', display: 'flex', alignItems: 'center' }}
                          title="Compartir por WhatsApp"
                        >
                          <svg size={14} viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </a>
                      </div>
                    )}
                  </span>
                </div>
                <div className="col-pos">
                  <span className="pos-badge">{player.position}</span>
                </div>
                <div className="col-dorsal">
                  <span className="dorsal-badge">#{player.dorsal || '-'}</span>
                </div>
                <div className="col-stats">
                  <div className="stats-mini-grid">
                    <span className="stat-cell"><small>PAC</small>{player.pace}</span>
                    <span className="stat-cell"><small>SHO</small>{player.shooting}</span>
                    <span className="stat-cell"><small>PAS</small>{player.passing}</span>
                    <span className="stat-cell"><small>DRI</small>{player.dribbling}</span>
                    <span className="stat-cell"><small>DEF</small>{player.defense}</span>
                    <span className="stat-cell"><small>PHY</small>{player.physical}</span>
                  </div>
                </div>
                <div className="col-ovr">
                  <span className={`ovr-badge ${player.overall >= 80 ? 'gold' : player.overall >= 65 ? 'silver' : 'bronze'}`}>
                    {player.overall}
                  </span>
                </div>
                <div className="col-actions">
                  <button className="icon-btn edit" title="Editar" onClick={() => handleEditClick(player)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn delete" title="Eliminar" onClick={() => handleDeletePlayer(player.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No se encontraron jugadores en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Modal Edición/Creación de Jugador */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="player-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>{editingPlayerId ? 'Editar' : 'Nuevo'} <span className="text-sky">Jugador</span></h2>
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>

              <div className="modal-body">
                <div className="player-preview-section">
                  <div className="player-preview-card glass">
                    <div className="preview-ovr">
                      <span>{overall}</span>
                      <small>{newPlayer.position}</small>
                    </div>
                    <img src={newPlayer.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newPlayer.full_name || 'default')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`} alt="Preview" />
                    <div className="preview-name">{newPlayer.full_name || 'NOMBRE JUGADOR'} {newPlayer.dorsal ? `(#${newPlayer.dorsal})` : ''}</div>
                  </div>
                </div>

                <div className="player-form">
                  <div className="form-row">
                    <div className="field">
                      <label>Nombre Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Mateo Miranda"
                        value={newPlayer.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        maxLength={80}
                      />
                    </div>
                    <div className="field">
                      <label>Posición</label>
                      <select value={newPlayer.position} onChange={e => handleInputChange('position', e.target.value)}>
                        <option value="POR">POR</option>
                        <option value="DFC">DFC</option>
                        <option value="LI">LI</option>
                        <option value="LD">LD</option>
                        <option value="MC">MC</option>
                        <option value="MCO">MCO</option>
                        <option value="EI">EI</option>
                        <option value="ED">ED</option>
                        <option value="DC">DC</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Dorsal N°</label>
                      <input 
                        type="number" 
                        value={newPlayer.dorsal}
                        onChange={(e) => handleInputChange('dorsal', e.target.value)}
                        placeholder="Ej: 10"
                        min="1" max="99"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Categoría</label>
                      <select 
                        className="form-input"
                        value={newPlayer.category_id || selectedCategory}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                      >
                        {categoriesList.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Fecha de Nacimiento <small>(Asigna categoría)</small></label>
                      <input 
                        type="date"
                        value={newPlayer.birth_date}
                        className="form-input"
                        onChange={e => handleInputChange('birth_date', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ── Sección Apoderado ── */}
                  <div className="parent-section">
                    <label className="section-label">👨 Apoderado</label>
                    <div className="parent-options-row">
                      <label className={`parent-radio ${parentOption === 'none' ? 'active' : ''}`}>
                        <input type="radio" name="parentOpt" checked={parentOption === 'none'} onChange={() => { setParentOption('none'); setSelectedParentId(''); }} />
                        Sin apoderado
                      </label>
                      <label className={`parent-radio ${parentOption === 'existing' ? 'active' : ''}`}>
                        <input type="radio" name="parentOpt" checked={parentOption === 'existing'} onChange={() => setParentOption('existing')} />
                        Existente
                      </label>
                      <label className={`parent-radio ${parentOption === 'new' ? 'active' : ''}`}>
                        <input type="radio" name="parentOpt" checked={parentOption === 'new'} onChange={() => setParentOption('new')} />
                        Crear nuevo
                      </label>
                    </div>

                    {parentOption === 'existing' && (
                      <div className="parent-select-wrap">
                        <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)} className="parent-dropdown">
                          <option value="">— Seleccionar apoderado —</option>
                          {existingParents.map(p => (
                            <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                          ))}
                        </select>
                        {existingParents.length === 0 && (
                          <small className="text-muted">No hay apoderados registrados aún.</small>
                        )}
                      </div>
                    )}

                    {parentOption === 'new' && (
                      <div className="parent-new-fields">
                        <div className="field">
                          <label>Nombre Apoderado</label>
                          <input type="text" placeholder="Ej: Pedro Miranda" value={newParentName} onChange={e => setNewParentName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 80))} maxLength={80} />
                        </div>
                        <div className="field">
                          <label>Teléfono <small>(opcional)</small></label>
                          <input type="tel" placeholder="+56 9 1234 5678" value={newParentPhone} onChange={e => setNewParentPhone(e.target.value.replace(/[^0-9+\s]/g, '').substring(0, 20))} maxLength={20} />
                        </div>
                        {newParentName.trim() && (
                          <div className="parent-preview-credentials">
                            <small>🔑 Se generará: <strong>{newParentName.trim().split(' ')[0]?.charAt(0).toLowerCase()}{newParentName.trim().split(' ').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')}</strong> / misma clave</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="stats-inputs-grid">
                    <div className="stat-input">
                      <label>RIT (PAC)</label>
                      <input type="range" min="1" max="99" value={newPlayer.pace} onChange={e => handleInputChange('pace', e.target.value)} />
                      <span>{newPlayer.pace}</span>
                    </div>
                    <div className="stat-input">
                      <label>TIR (SHO)</label>
                      <input type="range" min="1" max="99" value={newPlayer.shooting} onChange={e => handleInputChange('shooting', e.target.value)} />
                      <span>{newPlayer.shooting}</span>
                    </div>
                    <div className="stat-input">
                      <label>PAS (PAS)</label>
                      <input type="range" min="1" max="99" value={newPlayer.passing} onChange={e => handleInputChange('passing', e.target.value)} />
                      <span>{newPlayer.passing}</span>
                    </div>
                    <div className="stat-input">
                      <label>REG (DRI)</label>
                      <input type="range" min="1" max="99" value={newPlayer.dribbling} onChange={e => handleInputChange('dribbling', e.target.value)} />
                      <span>{newPlayer.dribbling}</span>
                    </div>
                    <div className="stat-input">
                      <label>DEF (DEF)</label>
                      <input type="range" min="1" max="99" value={newPlayer.defense} onChange={e => handleInputChange('defense', e.target.value)} />
                      <span>{newPlayer.defense}</span>
                    </div>
                    <div className="stat-input">
                      <label>FIS (PHY)</label>
                      <input type="range" min="1" max="99" value={newPlayer.physical} onChange={e => handleInputChange('physical', e.target.value)} />
                      <span>{newPlayer.physical}</span>
                    </div>
                  </div>

                  {formError && (
                    <div className="form-error-msg">
                      <XCircle size={16} />
                      {formError}
                    </div>
                  )}

                  <button 
                    className="btn-primary save-action" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <><RefreshCw size={18} className="spin-icon" /> Guardando...</>
                    ) : (
                      <><Save size={18} /> {editingPlayerId ? 'Guardar Cambios' : 'Registrar Jugador'}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Éxito con Credenciales */}
      <AnimatePresence>
        {successCredentials && (
          <div className="modal-overlay" onClick={() => setSuccessCredentials(null)}>
            <motion.div 
              className="player-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '450px', textAlign: 'center' }}
            >
              <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
                <h2>🎉 ¡Registro <span className="text-sky">Exitoso</span>!</h2>
              </div>
              <div className="modal-body" style={{ paddingTop: '10px', display: 'block' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                  El jugador ha sido guardado correctamente. Por favor, anota o comparte estas credenciales de acceso:
                </p>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '15px' }}>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '10px', fontSize: '0.9rem' }}>⚽ Credenciales del Jugador</h4>
                  <div style={{ fontSize: '0.95rem', marginBottom: '5px' }}><strong>Usuario:</strong> {successCredentials.playerUsername}</div>
                  <div style={{ fontSize: '0.95rem', marginBottom: '5px' }}><strong>Clave:</strong> {successCredentials.playerPassword}</div>
                  <div style={{ fontSize: '0.95rem' }}><strong>PIN (Enlace):</strong> {successCredentials.pin}</div>
                </div>

                {successCredentials.parent && successCredentials.parent.isNew && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '10px', fontSize: '0.9rem' }}>👨 Credenciales del Apoderado</h4>
                    <div style={{ fontSize: '0.95rem', marginBottom: '5px' }}><strong>Usuario:</strong> {successCredentials.parent.username}</div>
                    <div style={{ fontSize: '0.95rem' }}><strong>Clave:</strong> {successCredentials.parent.password}</div>
                  </div>
                )}

                {successCredentials.parent && !successCredentials.parent.isNew && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '10px', fontSize: '0.9rem' }}>👨 Apoderado Vinculado</h4>
                    <div style={{ fontSize: '0.95rem' }}>El jugador fue vinculado al apoderado existente: <strong>{successCredentials.parent.name}</strong></div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary-outline" onClick={() => setSuccessCredentials(null)} style={{ flex: 1 }}>Cerrar</button>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`⚽ ¡Hola! Te envío los datos de acceso para *${successCredentials.playerName}* en la App de la Escuelita Lo Miranda:%0A%0A👤 *Usuario:* ${successCredentials.playerUsername}%0A🔑 *Clave:* ${successCredentials.playerPassword}%0A📌 *PIN de Vinculación:* ${successCredentials.pin}${successCredentials.parent && successCredentials.parent.isNew ? `%0A%0A👨 *Apoderado:* ${successCredentials.parent.username}%0A🔑 *Clave:* ${successCredentials.parent.password}` : ''}%0A%0A¡Nos vemos en la cancha!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary" 
                    style={{ flex: 1, background: '#25D366', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg size={18} viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Players;
