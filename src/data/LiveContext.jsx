import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LiveContext = createContext();

const DEFAULT_CONFIG = {
  videoId: '',
  isLive: false,
  channelId: 'UCPKY87Gjxxyw1LiCYcxgs3w',
  isAutoMode: false
};

export const LiveProvider = ({ children }) => {
  const [liveConfig, setLiveConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('live_config')
          .select('*')
          .eq('id', 'current')
          .single();

        if (error) {
          // Table may not exist yet — silently use defaults
          console.warn('[LiveContext] live_config table not ready:', error.message);
          return;
        }
        if (data && mounted) setLiveConfig(data);
      } catch (err) {
        console.error('[LiveContext] fetchConfig error:', err);
      }
    };

    fetchConfig();

    // Real-time subscription — fail silently if unavailable
    let channel;
    try {
      channel = supabase
        .channel('live_config_changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_config',
          filter: 'id=eq.current'
        }, (payload) => {
          if (mounted) setLiveConfig(payload.new);
        })
        .subscribe();
    } catch (err) {
      console.warn('[LiveContext] realtime subscription error:', err);
    }

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const updateLiveConfig = async (newConfig) => {
    try {
      // Try update first; if row doesn't exist, insert it
      const { error } = await supabase
        .from('live_config')
        .upsert({ id: 'current', ...newConfig });

      if (error) console.error('[LiveContext] updateLiveConfig error:', error);
      else setLiveConfig(prev => ({ ...prev, ...newConfig }));
    } catch (err) {
      console.error('[LiveContext] updateLiveConfig exception:', err);
    }
  };

  return (
    <LiveContext.Provider value={{ ...liveConfig, updateLiveConfig }}>
      {children}
    </LiveContext.Provider>
  );
};

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) throw new Error('useLive must be used within a LiveProvider');
  return context;
};
