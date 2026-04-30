import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.jpg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, analizar correo para decidir destino (Onboarding vs Dashboard)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.email?.endsWith('@escuelita.local')) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Cargar email guardado
  useEffect(() => {
    const savedEmail = localStorage.getItem('escuelita_saved_email');
    if (savedEmail) {
      setUsername(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let loginEmail = username.trim();
      
      // Si el jugador escribió solo su usuario (ej: sjimenez), buscamos su correo real
      if (!loginEmail.includes('@')) {
        // Intentamos buscar en profiles si es que RLS nos lo permite
        // Filtramos buscando el perfil donde el email temporal empiece con ese username
        // o si hay algún campo específico. Si ya actualizó su correo, el email ya no tendrá el username.
        // Lo más seguro es intentar loguearse con el correo fantasma y si falla, dar el error normal.
        loginEmail = `${loginEmail}@escuelita.local`;
      }

      // Llamar directamente a supabase
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      // Si falló y el usuario había metido su username, quizás ya había cambiado su correo en Onboarding.
      // Como no tenemos el correo a mano por front, le avisamos:
      if (authError && !username.trim().includes('@')) {
         setError('Si ya configuraste tu cuenta, debes ingresar con tu Correo Real en lugar del nombre de usuario.');
         setLoading(false);
         return;
      } else if (authError) {
        // Traducir errores comunes
        let msg = authError.message;
        if (msg.includes('Invalid login')) msg = 'Usuario o contraseña incorrectos.';
        if (msg.includes('Email not confirmed')) msg = 'Tu correo aún no ha sido confirmado.';
        setError(msg);
        setLoading(false);
        return;
      }

      // Login exitoso — guardar email si "Recordarme" está activo
      if (rememberMe) {
        localStorage.setItem('escuelita_saved_email', username);
      } else {
        localStorage.removeItem('escuelita_saved_email');
      }

      // El useEffect de isAuthenticated se encargará de la redirección.
      // NO tocamos setLoading(false) aquí para que el botón siga diciendo "Ingresando..."
    } catch (err) {
      console.error('[Login] Error:', err);
      setError('Error de conexión. Revisa tu internet e intenta de nuevo.');
      setLoading(false);
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
            <label>Usuario Inicial o Correo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: sjimenez o tu@correo.cl"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="btn-eye" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordarme</span>
            </label>
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
