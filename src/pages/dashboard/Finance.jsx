import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  FileText,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../assets/logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, AlertCircle } from 'lucide-react';
import { showToast } from '../../components/Toast';
import './Finance.css';

const Finance = () => {
  const [financeList, setFinanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMovement, setNewMovement] = useState({
    description: '',
    amount: '',
    type: 'income',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchFinances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });
    
    if (!error && data) {
      setFinanceList(data);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchFinances();
  }, []);

  // Fechas para comparativas
  const currentDate = new Date();
  const prevMonthDate = subMonths(currentDate, 1);
  const currentMonthName = format(currentDate, "MMMM yyyy", { locale: es });
  const prevMonthName = format(prevMonthDate, "MMMM", { locale: es });

  // Cálculos financieros globales
  const totals = useMemo(() => {
    const income = financeList.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const expense = financeList.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [financeList]);

  // Cálculos por mes para el gráfico y comparativa
  const monthlyStats = useMemo(() => {
    const currentList = financeList.filter(f => isSameMonth(parseISO(f.date), currentDate));
    const prevList = financeList.filter(f => isSameMonth(parseISO(f.date), prevMonthDate));

    const currIncome = currentList.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const currExpense = currentList.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const currBalance = currIncome - currExpense;

    const prevIncome = prevList.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const prevExpense = prevList.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const prevBalance = prevIncome - prevExpense;

    return {
      current: { income: currIncome, expense: currExpense, balance: currBalance },
      prev: { income: prevIncome, expense: prevExpense, balance: prevBalance },
      diff: currBalance - prevBalance,
      deficit: currBalance < 0 || (currBalance < prevBalance && currBalance < 100000)
    };
  }, [financeList]);

  // Preparar datos para el gráfico de barras del MES ACTUAL
  const chartData = [
    { name: 'Ingresos', amount: monthlyStats.current.income, color: '#22c55e' },
    { name: 'Egresos', amount: monthlyStats.current.expense, color: '#ef4444' }
  ];

  const deficitSuggestions = [
    "Organizar una 'completada' o rifa solidaria para recaudar fondos rápidos.",
    "Buscar patrocinadores en negocios locales (Ej: estampar un logo por $50.000 mensuales).",
    "Ofrecer clínicas de técnica individual (1vs1) los fines de semana.",
    "Verificar que todos los apoderados estén al día con la cuota con un recordatorio."
  ];

  // Función para exportar a PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Logo y Título
    doc.addImage(logo, 'JPEG', 14, 10, 20, 20); // Logo en la esquina superior izquierda
    
    doc.setFontSize(18);
    doc.setTextColor(11, 42, 94); // Blue 900
    doc.text('REPORTE FINANCIERO - LO MIRANDA FC', 40, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 40, 28);
    
    // Resumen
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Resumen de Caja:', 14, 45);
    doc.text(`Total Ingresos: $${totals.income.toLocaleString()}`, 14, 55);
    doc.text(`Total Egresos: $${totals.expense.toLocaleString()}`, 14, 65);
    doc.text(`Balance Neto: $${totals.balance.toLocaleString()}`, 14, 75);

    // Tabla de movimientos
    const tableData = financeList.map(f => [
      f.date,
      f.description,
      f.type === 'income' ? 'Ingreso' : 'Egreso',
      `$${f.amount.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: 85,
      head: [['Fecha', 'Descripción', 'Tipo', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: [11, 42, 94] }
    });

    doc.save(`reporte_financiero_${new Date().getMonth() + 1}_2026.pdf`);
  };

  const handleSaveMovement = async () => {
    if (!newMovement.description || !newMovement.amount) {
       showToast('Completa los campos.', 'error');
       return;
    }
    
    setSaving(true);
    const mov = {
      description: newMovement.description,
      amount: parseFloat(newMovement.amount),
      type: newMovement.type,
      date: newMovement.date
    };

    const { error } = await supabase.from('payments').insert([mov]);
    
    if (error) {
       showToast('Error al guardar movimiento: ' + error.message, 'error');
    } else {
       showToast('Movimiento registrado correctamente', 'success');
       fetchFinances();
       setShowModal(false);
       setNewMovement({ ...newMovement, description: '', amount: '' });
    }
    setSaving(false);
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Gestión de <span className="text-sky">Finanzas</span></h1>
          <p className="dash-subtitle">Visualiza el rendimiento económico y exporta reportes contables.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={exportPDF}>
            <Download size={18} />
            Exportar PDF
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      <div className="finance-summary-grid">
        <div className="finance-card glass income">
          <div className="f-card-icon"><TrendingUp size={24} /></div>
          <div className="f-card-content">
            <span className="label">Total Ingresos</span>
            <span className="value">${totals.income.toLocaleString()}</span>
          </div>
        </div>
        <div className="finance-card glass expense">
          <div className="f-card-icon"><TrendingDown size={24} /></div>
          <div className="f-card-content">
            <span className="label">Total Egresos</span>
            <span className="value">${totals.expense.toLocaleString()}</span>
          </div>
        </div>
        <div className="finance-card glass balance">
          <div className="f-card-icon"><Wallet size={24} /></div>
          <div className="f-card-content">
            <span className="label">Balance Neto</span>
            <span className="value">${totals.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="finance-main-grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
        <div className="chart-section glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header-mini" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} className="text-sky" />
              <h3 style={{ textTransform: 'uppercase' }}>Balance Mensual: <span className="text-sky">{currentMonthName}</span></h3>
            </div>
            
            {monthlyStats.diff !== 0 && (
              <div className={`compare-badge ${monthlyStats.diff > 0 ? 'positive' : 'negative'}`}>
                {monthlyStats.diff > 0 ? '▲' : '▼'} vs {prevMonthName}: ${Math.abs(monthlyStats.diff).toLocaleString()}
              </div>
            )}
          </div>

          <div className="chart-container" style={{ width: '100%', height: 280, flexShrink: 0, position: 'relative' }}>
            {monthlyStats.current.income === 0 && monthlyStats.current.expense === 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(7, 20, 40, 0.4)', borderRadius: '12px', backdropFilter: 'blur(2px)' }}>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>No hay registros en este mes</p>
              </div>
            )}
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8' }} 
                   domain={[0, Math.max(100000, monthlyStats.current.income, monthlyStats.current.expense)]} 
                   tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ background: '#0c1e3d', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', color: 'white' }} 
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} minPointSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {monthlyStats.deficit && (
            <div className="deficit-suggestions">
              <div className="ds-header">
                <AlertCircle size={20} className="text-red" style={{color: '#f87171'}} />
                <h4>Sugerencias para Remontar el Déficit</h4>
              </div>
              <ul className="ds-list">
                {deficitSuggestions.map((sug, i) => (
                  <li key={i}><Info size={14} className="text-sky" style={{ flexShrink: 0, marginTop: '2px' }}/> <span>{sug}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="recent-transactions glass">
          <div className="section-header-mini">
            <FileText size={18} className="text-sky" />
            <h3>Últimos Movimientos</h3>
          </div>
          <div className="transactions-list">
            {loading ? <p>Cargando movimientos...</p> : financeList.length === 0 ? <p>No hay datos.</p> : financeList.map(item => (
              <div key={item.id} className="transaction-item">
                <div className={`t-icon ${item.type}`}>
                  {item.type === 'income' ? <Plus size={16} /> : <div className="minus-sign"></div>}
                </div>
                <div className="t-info">
                  <span className="t-desc">{item.description}</span>
                  <span className="t-date">{item.date}</span>
                </div>
                <span className={`t-amount ${item.type}`}>
                  {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Movimiento */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              className="event-modal glass" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '500px', padding: '40px', background: 'var(--bg-surface)', borderRadius: '24px' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Nuevo <span className="text-sky">Movimiento</span></h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
              </div>

              <div className="event-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pago arbitraje, Cuota Juan, etc."
                    value={newMovement.description}
                    onChange={e => setNewMovement({ ...newMovement, description: e.target.value })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monto ($)</label>
                    <input 
                      type="number" 
                      placeholder="5000"
                      value={newMovement.amount}
                      onChange={e => setNewMovement({ ...newMovement, amount: e.target.value })}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</label>
                    <input 
                      type="date"
                      value={newMovement.date}
                      onChange={e => setNewMovement({ ...newMovement, date: e.target.value })}
                      style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo de Movimiento</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => setNewMovement({ ...newMovement, type: 'income' })}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', border: newMovement.type === 'income' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)', background: newMovement.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: newMovement.type === 'income' ? '#22c55e' : 'white' }}
                    >Ingreso (+)</button>
                    <button 
                      onClick={() => setNewMovement({ ...newMovement, type: 'expense' })}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', border: newMovement.type === 'expense' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: newMovement.type === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: newMovement.type === 'expense' ? '#ef4444' : 'white' }}
                    >Egreso (-)</button>
                  </div>
                </div>

                <button 
                  onClick={handleSaveMovement}
                  disabled={saving}
                  style={{ marginTop: '15px', padding: '15px', background: 'var(--sky-400)', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none', opacity: saving ? 0.7 : 1 }}
                >{saving ? 'Guardando...' : 'Guardar Movimiento'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Finance;
