import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import logo from '../assets/logo.jpg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <div className="login-header">
          <img src={logo} alt="Lo Miranda FC" className="login-logo" />
          <h2>Escuelita <span className="text-sky">Lo Miranda</span></h2>
          <p>Ingresa al panel de gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Correo o Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: tu@correo.cl o mateo"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-login">Ingresar</button>
        </form>

        <div className="login-hint">
          <p><strong>Cuentas de prueba:</strong></p>
          <div className="hint-grid">
            <p>Admin: <code>admin@lomiranda.cl</code> / <code>admin2026</code></p>
            <p>DT: <code>dt@lomiranda.cl</code> / <code>dt2026</code></p>
            <p>Contabilidad: <code>contador@lomiranda.cl</code> / <code>contador2026</code></p>
            <p>Padre: <code>padre@lomiranda.cl</code> / <code>padre2026</code></p>
            <p>Jugador (Niño): Usuario <code>mateo</code> / Clave <code>jugador2026</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
