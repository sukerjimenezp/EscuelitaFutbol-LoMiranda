import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import logo from '../assets/logo.jpg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Timeout de 8 segundos para evitar bloqueos infinitos
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado. Revisa tu internet o intenta de nuevo.')), 8000)
    );

    try {
      console.log('[Login] Iniciando autenticación...');
      const result = await Promise.race([
        login(username, password),
        timeout
      ]);

      if (result.success) {
        console.log('[Login] Éxito, navegando al dashboard.');
        navigate('/dashboard');
      } else {
        console.warn('[Login] Fallo:', result.error);
        setError(result.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      console.error('[Login] Error crítico:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      if (typeof setLoading === 'function') setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass">
        <div className="login-header">
          <img src={logo} alt="Lo Miranda FC" className="login-logo" />
          <h2>Escuelita <span className="text-sky">Lo Miranda</span></h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu@correo.cl"
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

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
