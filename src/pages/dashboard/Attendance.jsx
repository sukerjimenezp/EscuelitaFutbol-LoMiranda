import React, { useState } from 'react';
import { useAuth } from '../../data/AuthContext';
import { playersByCategory, categories } from '../../data/mockData';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar as CalendarIcon, 
  Users,
  Save,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(user?.category || 'sub10');
  
  // Estado local para la asistencia del día
  const initialPlayers = playersByCategory[selectedCategory] || [];
  const [attendanceData, setAttendanceData] = useState(
    initialPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 'present' }), {})
  );

  const toggleAttendance = (id, status) => {
    setAttendanceData(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = () => {
    console.log('Asistencia guardada:', attendanceData);
    alert('Asistencia del día guardada correctamente.');
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = initialPlayers.length - presentCount;

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
        <button className="btn-primary save-btn" onClick={handleSave}>
          <Save size={18} />
          Guardar Asistencia
        </button>
      </div>

      <div className="attendance-stats-row">
        <div className="stat-box glass present">
          <CheckCircle2 size={24} />
          <div className="stat-meta">
            <span className="value">{presentCount}</span>
            <span className="label">Presentes</span>
          </div>
        </div>
        <div className="stat-box glass absent">
          <XCircle size={24} />
          <div className="stat-meta">
            <span className="value">{absentCount}</span>
            <span className="label">Ausentes</span>
          </div>
        </div>
        <div className="stat-box glass category-filter">
          <Filter size={24} className="text-muted" />
          <div className="stat-meta">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="cat-select"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <span className="label">Filtrar Categoría</span>
          </div>
        </div>
      </div>

      <div className="attendance-list glass">
        <div className="list-header">
          <div className="col-player">Jugador</div>
          <div className="col-status">Estado de Asistencia</div>
        </div>

        <div className="list-body">
          {initialPlayers.map(player => (
            <div key={player.id} className="attendance-row">
              <div className="col-player">
                <img src={player.image} alt={player.name} className="row-avatar" />
                <div className="player-info">
                  <div className="name-row">
                    <span className="player-name">{player.name}</span>
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
                    <CheckCircle2 size={18} />
                    Presente
                  </button>
                  <button 
                    className={`btn-status absent ${attendanceData[player.id] === 'absent' ? 'active' : ''}`}
                    onClick={() => toggleAttendance(player.id, 'absent')}
                  >
                    <XCircle size={18} />
                    Ausente
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
