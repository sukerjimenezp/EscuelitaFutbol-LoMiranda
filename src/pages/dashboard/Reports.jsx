import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  Calendar,
  FileDigit
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo.jpg';
import { finances, playersByCategory } from '../../data/mockData';
import { format, parseISO, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import './Reports.css';

const reportsList = [
  { id: 1, title: 'Balance General Mensual', type: 'financiero', desc: 'Resumen completo de ingresos y egresos de un mes específico.', icon: FileDigit },
  { id: 3, title: 'Reporte de Patrocinadores', type: 'financiero', desc: 'Detalle de ingresos provenientes de auspicios.', icon: FileText },
  { id: 4, title: 'Asistencia Mensual Histórica', type: 'deportivo', desc: 'Consolidado de asistencia de jugadores por categoría.', icon: Calendar },
];

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Estados para el Modal de Selección de Mes
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [activeReportId, setActiveReportId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const filteredReports = reportsList.filter(rep => {
    const matchesSearch = rep.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || rep.type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePreGenerate = (reportId) => {
    if (reportId === 1 || reportId === 4) {
      setActiveReportId(reportId);
      setShowMonthModal(true);
    } else {
      generatePDF(reportId, null);
    }
  };

  const generatePDF = (reportId, targetMonthStr) => {
    const doc = new jsPDF();
    doc.addImage(logo, 'JPEG', 14, 10, 20, 20);
    doc.setFontSize(18);
    doc.setTextColor(11, 42, 94);
    
    let filename = `reporte_${reportId}_2026.pdf`;

    if (reportId === 1) {
      if (!targetMonthStr) return;
      const targetDate = parseISO(targetMonthStr + '-01');
      const monthName = format(targetDate, 'MMMM yyyy', { locale: es }).toUpperCase();
      
      doc.text(`BALANCE GENERAL: ${monthName}`, 40, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 40, 28);
      
      const filteredFinances = finances.filter(f => isSameMonth(parseISO(f.date), targetDate));
      
      const tableData = filteredFinances.map(f => [f.date, f.description, f.type === 'income' ? 'Ingreso' : 'Egreso', `$${f.amount.toLocaleString()}`]);
      autoTable(doc, { startY: 45, head: [['Fecha', 'Detalle', 'Tipo', 'Monto']], body: tableData, theme: 'grid' });
      
      filename = `balance_${targetMonthStr}.pdf`;
    } else if (reportId === 3) {
      doc.text('REPORTE DE PATROCINADORES', 40, 20);
      doc.text('Generado el: ' + new Date().toLocaleDateString(), 40, 28);
      const sponsorIncomes = finances.filter(f => f.type === 'income' && f.description.toLowerCase().includes('patrocinador')).map(f => [f.date, f.description, `$${f.amount.toLocaleString()}`]);
      autoTable(doc, { startY: 45, head: [['Fecha', 'Patrocinador', 'Aporte']], body: sponsorIncomes.length ? sponsorIncomes : [['-', 'Sin aportes registrados', '-']], theme: 'grid' });
      filename = 'reporte_patrocinadores.pdf';
    } else if (reportId === 4) {
      if (!targetMonthStr) return;
      const targetDate = parseISO(targetMonthStr + '-01');
      const monthName = format(targetDate, 'MMMM yyyy', { locale: es }).toUpperCase();

      doc.text(`ASISTENCIA MENSÚAL: ${monthName}`, 40, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 40, 28);
      
      // Simular asistencia para la fecha indicada
      const allPlayers = Object.values(playersByCategory).flat();
      const attendanceData = allPlayers.map(u => {
        // Simulamos porcentaje de asistencia aleatorio entre 60% y 100% para este reporte
        const randomPercent = Math.floor(Math.random() * (100 - 60 + 1) + 60);
        return [u.name, u.category || 'Sin Cat.', `${randomPercent}%`, randomPercent > 80 ? 'Excelente' : 'Regular'];
      });

      autoTable(doc, { startY: 45, head: [['Jugador', 'Categoría', 'Asistencia (%)', 'Observación']], body: attendanceData, theme: 'grid' });
      filename = `asistencia_${targetMonthStr}.pdf`;
    }

    doc.save(filename);
    setShowMonthModal(false);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Centro de <span className="text-sky">Reportes</span></h1>
          <p className="dash-subtitle">Genera y exporta documentos oficiales de contabilidad y administración.</p>
        </div>
      </div>

      <div className="reports-search-bar glass">
        <div className="search-input-group">
          <Search size={20} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nombre de reporte..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} className="text-muted" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tipos (Todos)</option>
            <option value="financiero">Financieros</option>
            <option value="administrativo">Administrativos</option>
            <option value="deportivo">Deportivos</option>
          </select>
        </div>
      </div>

      <div className="reports-grid">
        {filteredReports.map(report => (
          <div key={report.id} className="report-card glass">
            <div className="rc-icon">
              <report.icon size={24} className="text-sky" />
            </div>
            <div className="rc-info">
              <h3>{report.title}</h3>
              <p>{report.desc}</p>
              <div className={`rc-badge ${report.type}`}>
                {report.type}
              </div>
            </div>
            <button className="btn-primary rc-btn" onClick={() => handlePreGenerate(report.id)}>
              <Download size={18} />
              Generar PDF
            </button>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="no-reports-msg">
            <p>No se encontraron reportes con esta búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal para Selección de Fecha */}
      <AnimatePresence>
        {showMonthModal && (
          <div className="modal-overlay" onClick={() => setShowMonthModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              className="event-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '400px', padding: '30px', background: 'var(--bg-surface)', borderRadius: '24px' }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Selecciona el <span className="text-sky">Mes</span></h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mes a Exportar</label>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontSize: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary-outline" onClick={() => setShowMonthModal(false)} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => generatePDF(activeReportId, selectedMonth)}>Descargar PDF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
