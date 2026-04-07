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
          console.warn('[LiveContext] live_config table not ready:', error.message);
          return;
        }
        if (data && mounted) {
          setLiveConfig({
            videoId: data.video_id,
            isLive: data.is_live,
            channelId: data.channel_id,
            isAutoMode: data.is_auto_mode
          });
        }
      } catch (err) {
        console.error('[LiveContext] fetchConfig error:', err);
      }
    };

    fetchConfig();

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
          if (mounted && payload.new) {
            setLiveConfig({
              videoId: payload.new.video_id,
              isLive: payload.new.is_live,
              channelId: payload.new.channel_id,
              isAutoMode: payload.new.is_auto_mode
            });
          }
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
      const dbConfig = {
        id: 'current',
        video_id: newConfig.videoId,
        is_live: newConfig.isLive,
        channel_id: newConfig.channelId,
        is_auto_mode: newConfig.isAutoMode
      };

      const { error } = await supabase
        .from('live_config')
        .upsert(dbConfig);

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
  if (context === undefined) throw new Error('useLive must be used within a LiveProvider');
  return context;
};

export default LiveContext;
