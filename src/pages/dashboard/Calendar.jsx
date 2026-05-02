import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  MapPin, 
  Clock,
  Trophy,
  Activity,
  X,
  Save,
  Copy,
  CheckCircle,
  MessageCircle,
  Image as ImageIcon,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../data/AuthContext';
import './Calendar.css';

const Calendar = () => {
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'dt', 'contador'].includes(user.role);

  // Helper para evitar desfases de zona horaria al parsear 'YYYY-MM-DD'
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Al usar el constructor new Date(y, m, d) JS asume hora local,
    // evitando que '2026-05-10' se interprete como UTC y retroceda un día.
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // Nuevo: Estado para confirmación de borrado
  const [eventList, setEventList] = useState(events);
  
  // Estado para ver detalles de un evento
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Estado para WhatsApp
  const [showWaModal, setShowWaModal] = useState(false);
  const [waMessage, setWaMessage] = useState("⚽ ¡Hola familia Escuelita Lo Miranda FC!\n\nLes informamos que ya hemos actualizado el calendario con los próximos entrenamientos y eventos.\n\nPor favor, ingresen a la plataforma para revisarlos.\n\n¡Nos vemos en la cancha! 🏆");
  const [waImage, setWaImage] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategoriesList(data);
    };
    fetchCategories();
  }, []);

  // Estado para carga masiva
  const [bulkConfig, setBulkConfig] = useState({
    title: 'Entrenamiento',
    type: 'training',
    days: [], // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
    dateFrom: format(new Date(), 'yyyy-MM-dd'),
    dateTo: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    time: '17:00',
    location: 'Cancha Lo Miranda',
    category: 'sub10'
  });

  // Estado del nuevo evento
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    location: 'Cancha Lo Miranda',
    type: 'training',
    category: 'sub10',
    description: ''
  });

  // Estado para Coordinación de Partidos
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchCoordination, setMatchCoordination] = useState({
    rival: '',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), // Default: en 3 días
    location: 'Cancha Lo Miranda',
    series: [], // Array de { id: 'sub10', time: '09:00' }
    description: '',
    flyer: null
  });

  // Lógica de fechas
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredEvents = eventList.filter(e => 
    selectedCategory === 'all' || e.category === selectedCategory || !e.category
  );

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleInputChange = (field, value) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEvent = () => {
    if (!newEvent.title) return alert('Debes ingresar un título para el evento');

    if (newEvent.id) {
      // Editar evento existente
      setEventList(prev => prev.map(e => e.id === newEvent.id ? newEvent : e));
    } else {
      // Crear nuevo evento
      const eventToSave = {
        ...newEvent,
        id: Date.now(),
      };
      setEventList(prev => [...prev, eventToSave]);
    }

    setShowModal(false);
    resetNewEvent();
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      location: 'Cancha Lo Miranda',
      type: 'training',
      category: 'sub10',
      description: ''
    });
  };

  const handleDeleteEvent = (eventId) => {
    // Si ya estamos en estado de confirmación, ejecutamos el borrado
    if (isDeleting) {
      setEventList(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      setIsDeleting(false);
    } else {
      // Si no, activamos la confirmación
      setIsDeleting(true);
    }
  };

  const handleEditClick = (event) => {
    setNewEvent(event);
    setSelectedEvent(null);
    setShowModal(true);
    setIsDeleting(false); // Reset por si acaso
  };

  // Toggle día de la semana en carga masiva
  const toggleBulkDay = (dayIndex) => {
    setBulkConfig(prev => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex]
    }));
  };

  // Generar eventos masivos
  const handleBulkCreate = () => {
    if (bulkConfig.days.length === 0) return alert('Selecciona al menos un día de la semana');
    if (!bulkConfig.title) return alert('Ingresa un título para los eventos');

    const from = parseLocalDate(bulkConfig.dateFrom);
    const to = parseLocalDate(bulkConfig.dateTo);
    const allDays = eachDayOfInterval({ start: from, end: to });

    // Filtrar solo los días seleccionados (getDay: 0=Dom, 1=Lun...6=Sab)
    const matchingDays = allDays.filter(day => bulkConfig.days.includes(getDay(day)));

    const newEvents = matchingDays.map((day, idx) => ({
      id: Date.now() + idx,
      title: bulkConfig.title,
      date: format(day, 'yyyy-MM-dd'),
      time: bulkConfig.time,
      location: bulkConfig.location,
      type: bulkConfig.type,
      category: bulkConfig.category
    }));

    setEventList(prev => [...prev, ...newEvents]);
    setBulkSuccess(newEvents.length);

    setTimeout(() => {
      setBulkSuccess(null);
      setShowBulkModal(false);
    }, 2000);
  };

  // Enviar mensaje por WhatsApp
  const handleSendWhatsApp = () => {
    // La API de WhatsApp URL scheme sólo soporta texto predefinido, no archivos adjuntos.
    // El texto se codifica para pasarlo en la URL.
    const encodedText = encodeURIComponent(waMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
    setShowWaModal(false);
  };

  // Manejar carga de imagen flyer
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWaImage(URL.createObjectURL(file));
    }
  };

  // ── Lógica Coordinación de Partidos ──

  const handleToggleMatchSerie = (categoryId) => {
    setMatchCoordination(prev => {
      const exists = prev.series.find(s => s.id === categoryId);
      if (exists) {
        return { ...prev, series: prev.series.filter(s => s.id !== categoryId) };
      } else {
        return { ...prev, series: [...prev.series, { id: categoryId, time: '10:00' }] };
      }
    });
  };

  const handleMatchTimeChange = (categoryId, time) => {
    setMatchCoordination(prev => ({
      ...prev,
      series: prev.series.map(s => s.id === categoryId ? { ...s, time } : s)
    }));
  };

  const handleMatchFlyerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMatchCoordination(prev => ({ ...prev, flyer: URL.createObjectURL(file) }));
    }
  };

  const handleSaveMatchCoordination = () => {
    if (!matchCoordination.rival.trim()) return alert('Debes ingresar el nombre del club rival');
    if (matchCoordination.series.length === 0) return alert('Debes seleccionar al menos una serie para el encuentro');

    // Generar un evento "match" por cada serie seleccionada
    const newEvents = matchCoordination.series.map((serie, idx) => ({
      id: Date.now() + idx,
      type: 'match',
      title: `vs ${matchCoordination.rival}`,
      date: matchCoordination.date,
      time: serie.time,
      location: matchCoordination.location,
      category: serie.id,
      description: matchCoordination.description,
      flyer: matchCoordination.flyer // Guardamos la referencia de la imagen
    }));

    setEventList(prev => [...prev, ...newEvents]);
    setShowMatchModal(false);

    // Formatear mensaje de WhatsApp sugerido
    // Usamos parseLocalDate para que la fecha en el mensaje coincida con lo ingresado
    const matchDateObj = parseLocalDate(matchCoordination.date);
    let waSuggestedMessage = `⚽ *PROGRAMACIÓN OFICIAL* ⚽\n\n🏆 *Encuentro:* Lo Miranda FC vs ${matchCoordination.rival}\n📅 *Fecha:* ${format(matchDateObj, "EEEE d 'de' MMMM", { locale: es })}\n📍 *Lugar:* ${matchCoordination.location}\n\n*🕒 HORARIOS POR SERIE:*\n`;
    
    // Ordenar series por hora para el mensaje
    const sortedSeries = [...matchCoordination.series].sort((a, b) => a.time.localeCompare(b.time));
    
    sortedSeries.forEach(s => {
      const catName = categoriesList.find(c => c.id === s.id)?.name || s.id;
      waSuggestedMessage += `🔹 *${catName}:* ${s.time} hrs\n`;
    });

    if (matchCoordination.description) {
      waSuggestedMessage += `\n📝 *Notas:* ${matchCoordination.description}\n`;
    }
    
    waSuggestedMessage += `\n¡Los esperamos a todos con la mejor energía! 🙌⚽`;

    // Resetear formulario
    setMatchCoordination({
      rival: '',
      date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      location: 'Cancha Lo Miranda',
      series: [],
      description: '',
      flyer: null
    });

    // Abrir modal de WhatsApp con el texto pre-llenado (y la imagen si existe)
    setWaMessage(waSuggestedMessage);
    setWaImage(matchCoordination.flyer);
    setTimeout(() => {
      setShowWaModal(true);
    }, 500);
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Calendario <span className="text-sky">Deportivo</span></h1>
          <p className="dash-subtitle">Planifica entrenamientos, partidos y eventos especiales.</p>
        </div>
        <div className="header-actions">
          <div className="category-filter glass">
            <Filter size={18} className="text-muted" />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">Todas las Categorías</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {isAdmin && (
            <>
              <button className="btn-success-solid" onClick={() => setShowWaModal(true)} style={{ background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                <MessageCircle size={18} />
                Notificar
              </button>
              <button className="btn-secondary-outline" onClick={() => setShowBulkModal(true)}>
                <Copy size={18} />
                Carga Masiva
              </button>
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} onClick={() => setShowMatchModal(true)}>
                <Trophy size={18} />
                Coordinar Encuentro
              </button>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} />
                Agendar Evento
              </button>
            </>
          )}
        </div>
      </div>

      <div className="calendar-main-grid">
        {/* Calendario Mensual */}
        <div className="calendar-container glass">
          <div className="calendar-header">
            <h2 className="month-name">{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
            <div className="calendar-nav">
              <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="btn-outline-mini">Hoy</button>
              <button onClick={nextMonth} className="icon-btn"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="weekday-label">{day}</div>
            ))}
            {calendarDays.map((day, idx) => {
              // Comparamos strings directamente 'yyyy-MM-dd' para evitar problemas de zona horaria
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayEvents = filteredEvents.filter(e => e.date === dayStr);
              const hasEvents = dayEvents.length > 0;
              return (
                <div 
                  key={idx} 
                  className={`calendar-day ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}
                >
                  <span className="day-number">{format(day, 'd')}</span>
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map(e => (
                      <div 
                        key={e.id} 
                        className={`event-pill ${e.type}`} 
                        title={e.title}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEvent(e);
                        }}
                      >
                        <span className="pill-icon">
                          {e.type === 'match' ? '⚽' : e.type === 'training' ? '🏋️' : e.type === 'tournament' ? '🏆' : '📋'}
                        </span>
                        <span className="pill-text">{e.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="event-pill more">+{dayEvents.length - 2} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de Próximos Eventos */}
        <div className="upcoming-events glass">
          <div className="section-header-mini">
            <Activity size={18} className="text-sky" />
            <h3>Próximos Eventos</h3>
          </div>
          <div className="event-list">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`event-card ${event.type}`}
                  onClick={() => setSelectedEvent(event)}
                  style={{cursor: 'pointer'}}
                >
                  <div className="event-time">
                    <Clock size={14} />
                    <span>{event.time}</span>
                  </div>
                  <h4 className="event-title">{event.title}</h4>
                  <div className="event-meta">
                    <div className="meta-item">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                    {event.category && (
                      <div className="meta-item">
                        <Trophy size={14} />
                        <span>{event.category.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-events">No hay eventos programados para este filtro.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Agendar Evento */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              className="event-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>{newEvent.id ? 'Editar' : 'Agendar'} <span className="text-sky">Evento</span></h2>
                <button className="close-btn" onClick={() => { setShowModal(false); resetNewEvent(); }}><X size={24} /></button>
              </div>

              <div className="event-form">
                <div className="form-row">
                  <div className="field">
                    <label>Título del Evento</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Partido vs Rancagua"
                      value={newEvent.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Tipo</label>
                    <select value={newEvent.type} onChange={e => handleInputChange('type', e.target.value)}>
                      <option value="training">🏋️ Entrenamiento</option>
                      <option value="match">⚽ Partido</option>
                      <option value="meeting">📋 Reunión</option>
                      <option value="tournament">🏆 Torneo</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Fecha</label>
                    <input 
                      type="date" 
                      value={newEvent.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Hora</label>
                    <input 
                      type="time" 
                      value={newEvent.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Ubicación</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Cancha Lo Miranda"
                      value={newEvent.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Categoría</label>
                    <select value={newEvent.category} onChange={e => handleInputChange('category', e.target.value)}>
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Descripción (Opcional)</label>
                  <textarea 
                    placeholder="Notas adicionales sobre el evento..."
                    value={newEvent.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <button className="btn-primary save-action" onClick={handleSaveEvent}>
                  <Save size={18} />
                  {newEvent.id ? 'Guardar Cambios' : 'Agendar Evento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Carga Masiva */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <motion.div 
              className="event-modal bulk-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              {bulkSuccess ? (
                <div className="bulk-success">
                  <CheckCircle size={48} className="text-green" />
                  <h2>¡{bulkSuccess} eventos creados!</h2>
                  <p>Se agendaron exitosamente en el calendario.</p>
                </div>
              ) : (
                <>
                  <div className="modal-header">
                    <h2>Carga <span className="text-sky">Masiva</span></h2>
                    <button className="close-btn" onClick={() => setShowBulkModal(false)}><X size={24} /></button>
                  </div>

                  <p className="bulk-description">Programa eventos recurrentes seleccionando los días de la semana y el rango de fechas.</p>

                  <div className="event-form">
                    <div className="form-row">
                      <div className="field">
                        <label>Nombre del Evento</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Entrenamiento Sub-10"
                          value={bulkConfig.title}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label>Tipo</label>
                        <select value={bulkConfig.type} onChange={e => setBulkConfig(prev => ({ ...prev, type: e.target.value }))}>
                          <option value="training">🏋️ Entrenamiento</option>
                          <option value="match">⚽ Partido</option>
                          <option value="meeting">📋 Reunión</option>
                          <option value="tournament">🏆 Torneo</option>
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>Días de la Semana</label>
                      <div className="days-selector">
                        {[
                          { index: 1, label: 'Lun' },
                          { index: 2, label: 'Mar' },
                          { index: 3, label: 'Mié' },
                          { index: 4, label: 'Jue' },
                          { index: 5, label: 'Vie' },
                          { index: 6, label: 'Sáb' },
                          { index: 0, label: 'Dom' }
                        ].map(day => (
                          <button
                            key={day.index}
                            className={`day-toggle ${bulkConfig.days.includes(day.index) ? 'active' : ''}`}
                            onClick={() => toggleBulkDay(day.index)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="field">
                        <label>Desde</label>
                        <input 
                          type="date" 
                          value={bulkConfig.dateFrom}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label>Hasta</label>
                        <input 
                          type="date" 
                          value={bulkConfig.dateTo}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="field">
                        <label>Hora</label>
                        <input 
                          type="time" 
                          value={bulkConfig.time}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label>Ubicación</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Cancha Lo Miranda"
                          value={bulkConfig.location}
                          onChange={(e) => setBulkConfig(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Categoría</label>
                      <select value={bulkConfig.category} onChange={e => setBulkConfig(prev => ({ ...prev, category: e.target.value }))}>
                        {categoriesList.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <button className="btn-primary save-action" onClick={handleBulkCreate}>
                      <Copy size={18} />
                      Generar Eventos
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalles del Evento */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <motion.div 
              className="event-modal details-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Detalles del <span className="text-sky">Evento</span></h2>
                <button className="close-btn" onClick={() => setSelectedEvent(null)}><X size={24} /></button>
              </div>

              <div className="event-details-content">
                <div className={`details-type-badge ${selectedEvent.type}`}>
                    {selectedEvent.type === 'match' ? '⚽ Partido' : selectedEvent.type === 'training' ? '🏋️ Entrenamiento' : selectedEvent.type === 'tournament' ? '🏆 Torneo' : '📋 Reunión'}
                </div>
                
                <h3 className="details-title">{selectedEvent.title}</h3>
                
                <div className="details-meta-grid">
                  <div className="detail-item">
                    <CalendarIcon size={18} className="text-sky" />
                    <div>
                      <span className="detail-label">Fecha</span>
                      <p>{format(parseLocalDate(selectedEvent.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={18} className="text-sky" />
                    <div>
                      <span className="detail-label">Hora</span>
                      <p>{selectedEvent.time}</p>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <MapPin size={18} className="text-sky" />
                    <div>
                      <span className="detail-label">Ubicación</span>
                      <p>{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <Trophy size={18} className="text-sky" />
                    <div>
                      <span className="detail-label">Categoría</span>
                      <p>{selectedEvent.category ? categoriesList.find(c => c.id === selectedEvent.category)?.name : 'General'}</p>
                    </div>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="details-description">
                    <h4>Descripción</h4>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.flyer && (
                  <div className="details-flyer">
                    <h4>Flyer del Partido</h4>
                    <img src={selectedEvent.flyer} alt="Flyer del encuentro" className="flyer-img-detail" />
                  </div>
                )}
                
                <div className="details-actions">
                  <div className="admin-actions">
                    {isAdmin && (
                      <>
                        {!isDeleting ? (
                          <>
                            <button className="btn-edit" onClick={() => handleEditClick(selectedEvent)}>
                              <Edit size={16} />
                              Editar
                            </button>
                            <button className="btn-delete" onClick={() => setIsDeleting(true)}>
                              <Trash2 size={16} />
                              Eliminar
                            </button>
                          </>
                        ) : (
                          <div className="confirm-delete-zone">
                            <span>¿Confirmas eliminar?</span>
                            <button className="btn-confirm-delete" onClick={() => handleDeleteEvent(selectedEvent.id)}>Sí, borrar</button>
                            <button className="btn-cancel-delete" onClick={() => setIsDeleting(false)}>No</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button className="btn-secondary-outline" onClick={() => { setSelectedEvent(null); setIsDeleting(false); }}>Cerrar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Notificación WhatsApp */}
      <AnimatePresence>
        {showWaModal && (
          <div className="modal-overlay" onClick={() => setShowWaModal(false)}>
            <motion.div 
              className="event-modal wa-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Enviar <span style={{color: '#25D366'}}>WhatsApp</span> Global</h2>
                <button className="close-btn" onClick={() => setShowWaModal(false)}><X size={24} /></button>
              </div>

              <div className="wa-content">
                <p className="wa-description">Avisa a todos los apoderados y jugadores que el calendario ha sido actualizado. El mensaje se abrirá en WhatsApp Web listo para enviar a tu grupo.</p>
                
                <div className="wa-form-group">
                  <label>Mensaje a enviar:</label>
                  <textarea 
                    className="wa-textarea"
                    rows={8}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                  />
                </div>

                <div className="wa-form-group">
                  <label>Adjuntar Flyer / Imagen (Opcional):</label>
                  <div className="wa-upload-zone">
                    <input type="file" id="wa-image" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
                    <label htmlFor="wa-image" className="wa-upload-label">
                      <ImageIcon size={24} />
                      <span>{waImage ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</span>
                    </label>
                  </div>
                  {waImage && (
                    <div className="wa-image-preview">
                      <img src={waImage} alt="Preview" />
                      <button className="wa-remove-btn" onClick={() => setWaImage(null)}><X size={16} /></button>
                    </div>
                  )}
                  {waImage && (
                    <div className="wa-warning-msg">
                      <strong>Nota importante:</strong> WhatsApp Web no permite auto-adjuntar imágenes por código. Debes copiar la imagen y pegarla manualmente (Ctrl+V) en el chat si deseas enviarla.
                    </div>
                  )}
                </div>

                <button className="btn-success-solid wa-send-btn" onClick={handleSendWhatsApp}>
                  <Send size={18} />
                  Abrir WhatsApp Web
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Coordinación de Partido */}
      <AnimatePresence>
        {showMatchModal && (
          <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
            <motion.div 
              className="event-modal match-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h2>Coordinar <span className="text-warning">Encuentro</span></h2>
                <button className="close-btn" onClick={() => setShowMatchModal(false)}><X size={24} /></button>
              </div>

              <div className="match-form">
                <div className="form-row">
                  <div className="field">
                    <label>Club Rival</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Colo Colo Filial"
                      value={matchCoordination.rival}
                      onChange={(e) => setMatchCoordination(prev => ({ ...prev, rival: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Fecha</label>
                    <input 
                      type="date" 
                      value={matchCoordination.date}
                      onChange={(e) => setMatchCoordination(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Lugar del Encuentro</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Complejo Deportivo Rancagua"
                      value={matchCoordination.location}
                      onChange={(e) => setMatchCoordination(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Series Participantes y Horarios</label>
                  <div className="series-selection-grid">
                    {categories.map(cat => {
                      const isSelected = matchCoordination.series.some(s => s.id === cat.id);
                      const serieData = matchCoordination.series.find(s => s.id === cat.id);
                      
                      return (
                        <div key={cat.id} className={`serie-selection-row ${isSelected ? 'active' : ''}`}>
                          <label className="serie-checkbox">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleMatchSerie(cat.id)}
                            />
                            <span className="cat-dot" style={{ backgroundColor: cat.color }}></span>
                            {cat.name}
                          </label>
                          
                          {isSelected && (
                            <div className="serie-time-input">
                              <Clock size={14} />
                              <input 
                                type="time" 
                                value={serieData.time}
                                onChange={(e) => handleMatchTimeChange(cat.id, e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label>Flyer / Afiche del Partido</label>
                    <div className="match-flyer-uploader">
                      <input type="file" id="match-flyer" accept="image/*" onChange={handleMatchFlyerUpload} style={{ display: 'none' }} />
                      <label htmlFor="match-flyer" className="flyer-upload-zone">
                        {matchCoordination.flyer ? (
                          <div className="flyer-preview-container">
                            <img src={matchCoordination.flyer} alt="Preview Flyer" />
                            <div className="flyer-overlay"><ImageIcon size={20} /> Cambiar</div>
                          </div>
                        ) : (
                          <div className="flyer-placeholder">
                            <Plus size={32} />
                            <span>Subir Foto de Coordinación</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="field">
                    <label>Notas / Requisitos (Opcional)</label>
                    <textarea 
                      placeholder="Ej: Todos con polera azul. Llegar 20 min antes..."
                      value={matchCoordination.description}
                      onChange={(e) => setMatchCoordination(prev => ({ ...prev, description: e.target.value }))}
                      rows={5}
                    />
                  </div>
                </div>

                <button className="btn-primary save-action" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} onClick={handleSaveMatchCoordination}>
                  <Trophy size={18} />
                  Agendar Encuentro Completo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
