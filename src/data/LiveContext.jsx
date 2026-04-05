import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LiveContext = createContext();

export const LiveProvider = ({ children }) => {
  const [liveConfig, setLiveConfig] = useState({ 
    videoId: '', 
    isLive: false, 
    channelId: 'UCPKY87Gjxxyw1LiCYcxgs3w', 
    isAutoMode: false 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial config
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('live_config')
        .select('*')
        .eq('id', 'current')
        .single();
      
      if (data) setLiveConfig(data);
      setLoading(false);
    };

    fetchConfig();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel('live_config_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'live_config',
        filter: 'id=eq.current'
      }, (payload) => {
        setLiveConfig(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLiveConfig = async (newConfig) => {
    const { error } = await supabase
      .from('live_config')
      .update(newConfig)
      .eq('id', 'current');
    
    if (error) console.error('Error updating live config:', error);
  };

  return (
    <LiveContext.Provider value={{ ...liveConfig, updateLiveConfig, loading }}>
      {!loading && children}
    </LiveContext.Provider>
  );
};

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useLive must be used within a LiveProvider');
  }
  return context;
};
