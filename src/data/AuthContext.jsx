import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();
        if (mounted) setUser({ ...session.user, ...(profile || {}), name: profile?.full_name || session.user.email });
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false); // fail safe
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();
        if (mounted) setUser({ ...session.user, ...(profile || {}), name: profile?.full_name || session.user.email });
      } else {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  };

  const logout = async () => { await supabase.auth.signOut(); };

  const updateUserAvatar = async (newAvatarUrl) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id);
    if (!error) setUser({ ...user, avatar_url: newAvatarUrl });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      updateUserAvatar,
      isAuthenticated: !!user,
      isAdmin:     user?.role === 'superadmin',
      isDT:        user?.role === 'dt',
      isContador:  user?.role === 'contador',
      isParent:    user?.role === 'parent',
      isPlayer:    user?.role === 'player'
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
