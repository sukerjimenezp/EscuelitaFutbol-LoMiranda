import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profileError && profile && mounted) {
            // SEC-01 FIX: Check superadmin via server-side RPC instead of hardcoded emails
            const { data: isSA } = await supabase.rpc('is_superadmin');
            setUser({ 
              ...session.user, 
              ...profile, 
              name: profile.full_name || session.user.email,
              role: isSA ? 'superadmin' : profile.role
            });
          } else if (mounted) {
            // SEC-01 FIX: Fallback also uses RPC
            const { data: isSA } = await supabase.rpc('is_superadmin');
            if (isSA) {
              setUser({ ...session.user, name: 'Super Admin', role: 'superadmin' });
            } else {
              setUser(null);
              supabase.auth.signOut();
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // PERF-01 FIX: Use ref to track subscription and prevent memory leaks
    const profileSubRef = { current: null };

    const setupProfileSubscription = (userId) => {
      if (profileSubRef.current) profileSubRef.current.unsubscribe();
      
      profileSubRef.current = supabase
        .channel(`public:profiles:id=eq.${userId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${userId}` 
        }, payload => {
          if (mounted) {
            setUser(prev => ({
              ...prev,
              ...payload.new,
              name: payload.new.full_name || prev.email
            }));
          }
        })
        .subscribe();
    };

    // Listen for sign-in / sign-out events
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setupProfileSubscription(session.user.id);
        }

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // SEC-01 FIX: Server-side superadmin check
          const { data: isSA } = await supabase.rpc('is_superadmin');
          
          if (mounted) {
            setUser({ 
              ...session.user, 
              ...(profile || {}), 
              name: profile?.full_name || session.user.email,
              role: isSA ? 'superadmin' : profile?.role
            });
          }
        } catch (err) {
          console.error('[AuthContext] Auth change profile fetch error:', err);
          if (mounted) {
            const { data: isSA } = await supabase.rpc('is_superadmin').catch(() => ({ data: false }));
            if (isSA) {
              setUser({ ...session.user, name: 'Super Admin', role: 'superadmin' });
            } else {
              setUser(null);
              supabase.auth.signOut();
            }
          }
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        if (profileSubRef.current) profileSubRef.current.unsubscribe();
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
      if (profileSubRef.current) profileSubRef.current.unsubscribe();
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
