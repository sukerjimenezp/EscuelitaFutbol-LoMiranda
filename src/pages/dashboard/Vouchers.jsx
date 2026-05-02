import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../components/Toast';

const Vouchers = () => {
  const [financeList, setFinanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherSearchTerm, setVoucherSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchFinances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });
    
    if (!error && data) {
      setFinanceList(data);
    } else if (error) {
      showToast('Error al cargar comprobantes: ' + error.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const vouchersList = useMemo(() => {
    return financeList.filter(f => f.voucher_url != null);
  }, [financeList]);

  const filteredVouchers = useMemo(() => {
    if (!voucherSearchTerm) return vouchersList;
    return vouchersList.filter(f => f.description.toLowerCase().includes(voucherSearchTerm.toLowerCase()));
  }, [vouchersList, voucherSearchTerm]);

  return (
    <div className="finance-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="header-info">
          <h1 className="dash-title">Buscador de <span className="text-sky">Comprobantes</span></h1>
          <p className="dash-subtitle">Visualiza y filtra los vouchers y boletas cargados en el sistema.</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate('/dashboard/finanzas')}>
            <ArrowLeft size={18} />
            Volver a Finanzas
          </button>
        </div>
      </div>

      <div className="voucher-search-section glass" style={{ padding: '24px', borderRadius: '16px' }}>
        <div className="section-header-mini" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ImageIcon size={20} className="text-sky" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Archivos Adjuntos</h3>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o descripción..." 
              value={voucherSearchTerm}
              onChange={e => setVoucherSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        <div className="vouchers-table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>NOMBRE DEL DOCUMENTO</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>FECHA DE CARGA</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>MONTO ASIGNADO</th>
                <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando comprobantes...</td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {voucherSearchTerm ? 'No se encontraron comprobantes con ese nombre.' : 'No hay comprobantes cargados en el sistema.'}
                  </td>
                </tr>
              ) : (
                filteredVouchers.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '15px', fontWeight: 500 }}>{v.description}</td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{v.date}</td>
                    <td style={{ padding: '15px', color: v.type === 'income' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {v.type === 'income' ? '+' : '-'}${v.amount.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <a href={v.voucher_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--sky-400)', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
                        <ImageIcon size={14} /> Ver Boleta
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vouchers;
