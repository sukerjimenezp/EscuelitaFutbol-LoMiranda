import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [autoDetectedLive, setAutoDetectedLive] = useState(false);
  const [autoVideoId, setAutoVideoId] = useState('');

  // Fetch live_config from Supabase
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

  const checkYouTubeLive = useCallback(async () => {
    if (!liveConfig.isAutoMode || !liveConfig.channelId) return;

    try {
      // Usar proxy público (AllOrigins) para bypassear CORS y obtener el HTML de la página en vivo del canal
      const ytUrl = `https://www.youtube.com/channel/${liveConfig.channelId}/live`;
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(ytUrl)}&disableCache=${Date.now()}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.warn('[LiveContext] Error fetching YouTube via proxy:', res.status);
        return;
      }

      const html = await res.text();
      
      const isLiveBroadcast = html.includes('"isLiveBroadcast":true') || 
                              html.includes('"style":"LIVE"') ||
                              html.includes('"isLiveContent":true');
      
      if (isLiveBroadcast) {
        // Extraer el videoId de la transmisión
        let liveVideoId = '';
        const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (videoIdMatch) liveVideoId = videoIdMatch[1];

        if (liveVideoId) {
          setAutoDetectedLive(true);
          setAutoVideoId(liveVideoId);
          
          if (!liveConfig.isLive || liveConfig.videoId !== liveVideoId) {
            await supabase.from('live_config').update({
              is_live: true,
              video_id: liveVideoId
            }).eq('id', 'current');
          }
        }
      } else {
        setAutoDetectedLive(false);
        setAutoVideoId('');

        if (liveConfig.isLive && liveConfig.isAutoMode) {
          await supabase.from('live_config').update({
            is_live: false
          }).eq('id', 'current');
        }
      }
    } catch (err) {
      console.warn('[LiveContext] Auto-detect error:', err);
    }
  }, [liveConfig.isAutoMode, liveConfig.channelId, liveConfig.isLive, liveConfig.videoId]);

  useEffect(() => {
    if (!liveConfig.isAutoMode) return;

    checkYouTubeLive();
    const interval = setInterval(checkYouTubeLive, 60000);
    return () => clearInterval(interval);
  }, [liveConfig.isAutoMode, checkYouTubeLive]);

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

  const effectiveIsLive = liveConfig.isLive || autoDetectedLive;
  const effectiveVideoId = autoDetectedLive && autoVideoId ? autoVideoId : liveConfig.videoId;

  return (
    <LiveContext.Provider value={{ 
      ...liveConfig, 
      isLive: effectiveIsLive,
      videoId: effectiveVideoId,
      autoDetectedLive,
      updateLiveConfig 
    }}>
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
