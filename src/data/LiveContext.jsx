import React, { createContext, useContext, useState, useEffect } from 'react';

const LiveContext = createContext();

export const LiveProvider = ({ children }) => {
  const [liveConfig, setLiveConfig] = useState(() => {
    const saved = localStorage.getItem('loriranda_live_config');
    return saved ? JSON.parse(saved) : { 
      videoId: '', 
      isLive: false, 
      channelId: 'UCPKY87Gjxxyw1LiCYcxgs3w', 
      isAutoMode: false 
    };
  });

  useEffect(() => {
    localStorage.setItem('loriranda_live_config', JSON.stringify(liveConfig));
  }, [liveConfig]);

  const updateLiveConfig = (newConfig) => {
    setLiveConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <LiveContext.Provider value={{ ...liveConfig, updateLiveConfig }}>
      {children}
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
