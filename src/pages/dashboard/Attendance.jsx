import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { categories } from '../../data/mockData';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar as CalendarIcon, 
  Users,
  Save,
  Filter,
  Trophy,
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo.jpg';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Attendance.css';
import { showToast } from '../../components/Toast';

const Attendance = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(user?.category_id || 'sub10');
  const [players, setPlayers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for PDF Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMode, setReportMode] = useState('month');
  const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch Players
    const { data: playersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('category_id', selectedCategory)
      .eq('role', 'player');
    
    setPlayers(playersData || []);

    // 2. Fetch today's attendance
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: attendanceLog } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
    
    const mappedAttendance = {};
    playersData?.forEach(p => {
      const log = attendanceLog?.find(a => a.player_id === p.id);
      mappedAttendance[p.id] = log ? log.status : 'present';
    });

    setAttendanceData(mappedAttendance);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const toggleAttendance = (id, status) => {
    setAttendanceData(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // 1. Prepare Attendance Records
    const records = Object.entries(attendanceData).map(([playerId, status]) => ({
      player_id: playerId,
      date: today,
      status: status
    }));

    // 2. Upsert Attendance (Seguridad Idempotente en Supabase DB con Constraint \`unique_attendance_per_day\`)
    // IMPORTANTE: Los puntos de Gamificación ahora son manejados exclusivamente
    // mediante un Trigger en Supabase (ver remediation_patch.sql) cuando cambia a 'match' o 'present'.
    const { error: attError } = await supabase
       .from('attendance')
       .upsert(records, { onConflict: 'player_id, date' });

    if (attError) {
      showToast('Error al guardar asistencia: ' + attError.message, 'error');
    } else {
      showToast('¡Asistencia y Puntos de Recompensa guardados correctamente!', 'success');
    }
    
    setSaving(false);
  };

  const generateAttendanceReport = async () => {
    setGeneratingReport(true);
    let startDate, endDate, titlePeriod;

    if (reportMode === 'month') {
      if (!reportMonth) {
        showToast('Debes seleccionar un mes', 'error');
        setGeneratingReport(false);
        return;
      }
      startDate = `${reportMonth}-01`;
      const parts = reportMonth.split('-');
      const endDay = new Date(parts[0], parts[1], 0).getDate();
      endDate = `${reportMonth}-${endDay}`;
      titlePeriod = format(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1), 'MMMM yyyy', { locale: es }).toUpperCase();
    } else {
      if (!reportStart || !reportEnd) {
         showToast('Selecciona la fecha inicio y fin', 'error');
         setGeneratingReport(false);
         return;
      }
      startDate = reportStart;
      endDate = reportEnd;
      // Añadimos T00:00 y zona horaria local segura al formateo
      titlePeriod = `${format(new Date(startDate + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(endDate + 'T00:00:00'), 'dd/MM/yyyy')}`;
    }

    try {
      // 1. Fetch Players in the Category
      const { data: catPlayers } = await supabase
        .from('profiles')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('role', 'player');
      
      const catName = categories.find(c => c.id === selectedCategory)?.name || selectedCategory;

      if (!catPlayers || catPlayers.length === 0) {
        showToast('No hay jugadores en esta categoría', 'error');
        setGeneratingReport(false);
        return;
      }

      // 2. Fetch Attendance for dates
      const { data: attendanceLog, error: attError } = await supabase
        .from('attendance')
        .select('player_id, status, date')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (attError) throw attError;

      // 3. Process Data
      const tableData = catPlayers.map(player => {
        const playerLog = attendanceLog?.filter(a => a.player_id === player.id) || [];
        const totalClasses = playerLog.length;
        if (totalClasses === 0) return [player.full_name, '0', '0', '0', '0%'];
        
        const presents = playerLog.filter(a => a.status === 'present' || a.status === 'match').length;
        const absents = playerLog.filter(a => a.status === 'absent').length;
        const percentage = Math.round((presents / totalClasses) * 100);
        return [player.full_name, totalClasses.toString(), presents.toString(), absents.toString(), `${percentage}%`];
      });

      // 4. Generate PDF
      const doc = new jsPDF();
      
      // Intentar cargar logo para Vite
      const img = new window.Image();
      img.src = logo;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      try {
        doc.addImage(img, 'JPEG', 14, 10, 20, 20);
      } catch (e) {
        console.warn('No se pudo cargar el logo en PDF', e);
      }

      doc.setFontSize(18);
      doc.setTextColor(11, 42, 94);
      doc.text(`REPORTE DE ASISTENCIA: ${catName.toUpperCase()}`, 40, 18);
      doc.setFontSize(12);
      doc.text(`PERIODO: ${titlePeriod}`, 40, 26);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 40, 32);

      autoTable(doc, { 
        startY: 40, 
        head: [['Jugador', 'Clases Totales', 'Presentes/Partidos', 'Ausentes', '% Asistencia']], 
        body: tableData, 
        theme: 'grid',
        headStyles: { fillColor: [11, 42, 94] }
      });

      doc.save(`asistencia_${selectedCategory}_${startDate}.pdf`);
      showToast('Reporte generado exitosamente', 'success');
      setShowReportModal(false);
    } catch (err) {
      console.error(err);
      showToast('Error generando reporte: ' + (err.message || 'Desconocido'), 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present' || s === 'match').length;
  const matchCount = Object.values(attendanceData).filter(s => s === 'match').length;
  const absentCount = players.length - presentCount;

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Pase de <span className="text-sky">Lista</span></h1>
          <div className="date-display">
            <CalendarIcon size={18} className="text-muted" />
            <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>
          </div>
        </div>
        <button className="btn-primary save-btn" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar y Entregar Puntos'}
        </button>
      </div>

      <div className="filters-row glass mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="category-select">
          <Filter size={18} className="text-muted" />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading || saving}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button 
          className="btn-secondary-outline export-report-btn" 
          onClick={() => setShowReportModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <FileText size={16} /> Exportar Asistencia
        </button>
      </div>

      <div className="attendance-stats-row gamified">
        <div className="stat-box glass present">
          <CheckCircle2 size={24} />
          <div className="stat-meta">
            <span className="value">{presentCount - matchCount}</span>
            <span className="label">Presentes (+10)</span>
          </div>
        </div>
        <div className="stat-box glass match-day">
          <Trophy size={24} className="text-yellow" />
          <div className="stat-meta">
            <span className="value">{matchCount}</span>
            <span className="label">En Partido (+50)</span>
          </div>
        </div>
        <div className="stat-box glass absent">
          <XCircle size={24} />
          <div className="stat-meta">
            <span className="value">{absentCount}</span>
            <span className="label">Ausentes</span>
          </div>
        </div>
      </div>

      <div className="attendance-list glass">
        <div className="list-header">
          <div className="col-player">Jugador</div>
          <div className="col-status">Estado de Asistencia</div>
        </div>

        <div className="list-body">
          {players.map(player => (
            <div key={player.id} className="attendance-row">
              <div className="col-player">
                <img src={player.avatar_url} alt={player.full_name} className="row-avatar" />
                <div className="player-info">
                  <div className="name-row">
                    <span className="player-name">{player.full_name}</span>
                    <span className="player-dorsal">#{player.dorsal}</span>
                  </div>
                  <span className="player-pos">{player.position}</span>
                </div>
              </div>
              <div className="col-status">
                <div className="status-toggle">
                  <button 
                    className={`btn-status present ${attendanceData[player.id] === 'present' ? 'active' : ''}`}
                    onClick={() => toggleAttendance(player.id, 'present')}
                  >
                    <CheckCircle2 size={16} /> Entrenó
                  </button>
                  <button 
                    className={`btn-status match ${attendanceData[player.id] === 'match' ? 'active' : ''}`}
                    onClick={() => toggleAttendance(player.id, 'match')}
                  >
                    <Trophy size={16} /> Partido
                  </button>
                  <button 
                    className={`btn-status absent ${attendanceData[player.id] === 'absent' ? 'active' : ''}`}
                    onClick={() => toggleAttendance(player.id, 'absent')}
                  >
                    <XCircle size={16} /> Ausente
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              className="report-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '450px', padding: '30px', background: 'var(--bg-surface)', borderRadius: '24px', position: 'relative' }}
            >
              <button className="close-btn" style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowReportModal(false)}><X size={24} /></button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Exportar <span className="text-sky">Estadísticas</span></h2>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <button 
                  className={`btn-secondary-outline ${reportMode === 'month' ? 'active' : ''}`}
                  onClick={() => setReportMode('month')}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: reportMode === 'month' ? '2px solid var(--sky-500)' : '1px solid rgba(255,255,255,0.1)', background: reportMode === 'month' ? 'rgba(56, 189, 248, 0.1)' : 'transparent', color: 'white', cursor: 'pointer' }}
                >
                  Mensual
                </button>
                <button 
                  className={`btn-secondary-outline ${reportMode === 'range' ? 'active' : ''}`}
                  onClick={() => setReportMode('range')}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: reportMode === 'range' ? '2px solid var(--sky-500)' : '1px solid rgba(255,255,255,0.1)', background: reportMode === 'range' ? 'rgba(56, 189, 248, 0.1)' : 'transparent', color: 'white', cursor: 'pointer' }}
                >
                  Rango Fechas
                </button>
              </div>

              {reportMode === 'month' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selecciona el Mes</label>
                  <input 
                    type="month" 
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '1rem' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desde</label>
                    <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hasta</label>
                    <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }} />
                  </div>
                </div>
              )}

              <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }} onClick={generateAttendanceReport} disabled={generatingReport}>
                {generatingReport ? 'Calculando Asistencias...' : 'Descargar PDF'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Attendance;
