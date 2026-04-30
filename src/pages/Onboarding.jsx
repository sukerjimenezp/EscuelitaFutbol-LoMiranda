import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ShieldCheck, Mail, Lock } from 'lucide-react';
import logo from '../assets/logo.jpg';
import './Login.css'; // Reutilizamos estilos

const Onboarding = () => {
  const { isAuthenticated, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Si no está auth, fuera.
    if (!isAuthenticated) {
      navigate('/login');
    }
    // Si ya tiene un correo maduro, fuera (a menos que por error caiga aquí).
    if (user && !user.email?.endsWith('@escuelita.local')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setLoading(true);

    try {
      // 1. Actualizar cuenta Auth de Supabase
      const { data, error: updateError } = await supabase.auth.updateUser({
        email: email,
        password: password
      });

      if (updateError) {
        let msg = updateError.message;
        if (msg.includes('already registered')) msg = 'Este correo ya está siendo usado por otra cuenta.';
        // Importante: Si dice "email link sent", es que Confirm Email está activado.
        if (msg.toLowerCase().includes('rate limit')) msg = 'Demasiados intentos. Espera unos segundos.';
        setError(msg);
        setLoading(false);
        return;
      }

      // 2. Actualizar el Perfil con el correo nuevo 
      //    (usamos id del user de la base porque somos nosotros mismos)
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ email: email })
          .eq('id', user.id);
      }

      // 3. Forzar actualización de UI local y redirigir
      setUser(prev => ({ ...prev, email: email }));
      navigate('/dashboard');

    } catch (err) {
      console.error('Error actualizando Onboarding:', err);
      setError('Problema de conexión inesperado.');
      setLoading(false);
    }
  };

  if (!user || (!user.email?.endsWith('@escuelita.local') && isAuthenticated)) return null;

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <img src={logo} alt="Lo Miranda FC" className="login-logo" />
          <h2>Protege tu <span className="text-sky">Cuenta</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
            ¡Bienvenido a <b>Escuelita Lo Miranda!</b> Estás usando una credencial temporal.
            Por seguridad, debes configurar un correo válido y una contraseña personal para seguir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label><Mail size={14} style={{display:'inline', marginRight: '5px'}} /> Tu Correo Electrónico Real</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@gmail.com"
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Este correo servirá para recuperar tu contraseña si la olvidas.
            </small>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label><Lock size={14} style={{display:'inline', marginRight: '5px'}} /> Nueva Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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

          <div className="form-group">
            <label>Repetir Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma la contraseña"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={18} />
            {loading ? 'Protegiendo Cuenta...' : 'Guardar y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
