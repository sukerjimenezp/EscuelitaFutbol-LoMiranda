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
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(user?.category_id || 'sub10');
  const [players, setPlayers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    // 2. Upsert Attendance (Delete existing for today, then insert)
    await supabase.from('attendance').delete().eq('date', today);
    const { error: attError } = await supabase.from('attendance').insert(records);

    if (attError) {
      alert('Error saving attendance: ' + attError.message);
      setSaving(false);
      return;
    }

    // 3. GAMIFICATION: Award points for PRESENTE (+10) and MATCH (+50)
    // We iterate through entries to update points in profiles
    for (const [playerId, status] of Object.entries(attendanceData)) {
      if (status === 'present' || status === 'match') {
        const pointsToAdd = status === 'match' ? 50 : 10;
        
        // Supabase function approach is better, but since it's a simple dashboard:
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', playerId)
          .single();
        
        await supabase
          .from('profiles')
          .update({ points: (currentProfile?.points || 0) + pointsToAdd })
          .eq('id', playerId);
      }
    }

    alert('Asistencia y Puntos de Recompensa guardados correctamente.');
    setSaving(false);
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
    </div>
  );
};

export default Attendance;
