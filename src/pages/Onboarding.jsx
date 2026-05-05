import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, RefreshCw } from 'lucide-react';
import logo from '../assets/logo.jpg';
import './Login.css';

const Onboarding = () => {
  const { isAuthenticated, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isMinor, setIsMinor] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Si no está auth, fuera.
    if (!isAuthenticated) {
      navigate('/login');
    }
    // Si ya tiene el onboarding completado o un correo real, fuera
    if (user && (user.user_metadata?.onboarded || !user.email?.endsWith('@lomiranda.cl'))) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (user?.id && user.email?.endsWith('@lomiranda.cl')) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('birth_date, role').eq('id', user.id).single();
        if (data) {
          if (data.role === 'player' && data.birth_date) {
            const birthDate = new Date(data.birth_date);
            const ageDiffMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDiffMs);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            setIsMinor(age < 16);
          } else {
            setIsMinor(false); // Apoderados y demás roles son adultos
          }
        }
        setProfileLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    
    if (isMinor) {
      if (!/^\d{4}$/.test(password)) {
        return setError('El PIN debe ser exactamente de 4 dígitos numéricos.');
      }
    } else {
      if (password.length < 6) {
        return setError('La contraseña debe tener al menos 6 caracteres.');
      }
    }

    setLoading(true);

    try {
      let updatePayload = {
        password: isMinor ? password + '_pin' : password,
        data: { onboarded: true }
      };
      
      let targetEmail = user.email;

      if (!isMinor) {
        // Solo adultos configuran un correo real
        targetEmail = email;
        updatePayload.email = targetEmail;
      }

      // 1. Actualizar cuenta Auth de Supabase
      const { data, error: updateError } = await supabase.auth.updateUser(updatePayload);

      if (updateError) {
        let msg = updateError.message;
        if (msg.includes('already registered')) msg = 'Este correo ya está siendo usado por otra cuenta.';
        if (msg.toLowerCase().includes('rate limit')) msg = 'Demasiados intentos. Espera unos segundos.';
        if (msg.toLowerCase().includes('different from the old password')) msg = 'La nueva contraseña debe ser diferente a la contraseña temporal (tu nombre de usuario).';
        setError(msg);
        setLoading(false);
        return;
      }

      // 2. Actualizar el Perfil con el correo nuevo 
      if (user?.id && !isMinor) {
        await supabase
          .from('profiles')
          .update({ email: targetEmail })
          .eq('id', user.id);
      }

      // 3. Forzar actualización de UI local y redirigir
      setUser(prev => ({ ...prev, email: targetEmail }));
      navigate('/dashboard');

    } catch (err) {
      console.error('Error actualizando Onboarding:', err);
      setError('Problema de conexión inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (!user.email?.endsWith('@lomiranda.cl') && isAuthenticated)) return null;

  if (profileLoading) {
    return (
      <div className="login-page">
        <div className="login-card glass" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
          <RefreshCw size={32} className="spin-icon text-sky" style={{ margin: '0 auto 20px' }} />
          <p>Verificando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <img src={logo} alt="Lo Miranda FC" className="login-logo" />
          <h2>Protege tu <span className="text-sky">Cuenta</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
            ¡Bienvenido a <b>Escuelita Lo Miranda!</b> Estás usando una credencial temporal.
            Por seguridad, debes configurar tus credenciales definitivas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          {isMinor ? (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                💡 <strong>¡Hola!</strong> Como eres menor de 16 años, mantendrás tu nombre de usuario para siempre. Solo necesitas crear un <strong>PIN de 4 números</strong> fácil de recordar.
              </p>
            </div>
          ) : (
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
                Este correo servirá para ingresar a tu cuenta y recuperar contraseña.
              </small>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label><Lock size={14} style={{display:'inline', marginRight: '5px'}} /> {isMinor ? 'Nuevo PIN (4 Números)' : 'Nueva Contraseña'}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isMinor ? "Ej: 1234" : "Mínimo 6 caracteres"}
                maxLength={isMinor ? 4 : undefined}
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
            <label>Repetir {isMinor ? 'PIN' : 'Contraseña'}</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={`Confirma tu ${isMinor ? 'PIN' : 'contraseña'}`}
              maxLength={isMinor ? 4 : undefined}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={18} />
            {loading ? 'Guardando...' : 'Guardar y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
