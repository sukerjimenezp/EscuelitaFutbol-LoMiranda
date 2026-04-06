import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUser = (session, profile) => ({
    ...session.user,
    ...(profile || {}),
    name: profile?.full_name || session.user.email,
  });

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (mounted) setUser(buildUser(session, profile));
        }
      } catch (err) {
        console.error('[AuthContext] checkSession error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      try {
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (mounted) setUser(buildUser(session, profile));
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] onAuthStateChange error:', err);
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Error de conexión. Verifica tu internet.' };
    }
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch (err) { console.error('[AuthContext] logout error:', err); }
  };

  const updateUserAvatar = async (newAvatarUrl) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id);
      if (!error) setUser({ ...user, avatar_url: newAvatarUrl });
    } catch (err) { console.error('[AuthContext] updateUserAvatar error:', err); }
  };

  // Show spinner while checking auth — never block forever
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#060f1e' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(56,189,248,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      updateUserAvatar,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'superadmin',
      isDT: user?.role === 'dt',
      isContador: user?.role === 'contador',
      isParent: user?.role === 'parent',
      isPlayer: user?.role === 'player'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
