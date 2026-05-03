import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SkinsContext = createContext(null);

export const SkinsProvider = ({ children }) => {
  const { user } = useAuth();
  const [allSkins, setAllSkins] = useState([]);
  const [userSkins, setUserSkins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    // 1. Fetch all available skins
    const { data: skinsData } = await supabase
      .from('skins')
      .select('*')
      .order('cost', { ascending: true });
    
    setAllSkins(skinsData || []);

    // 2. Fetch user's unlocked skins
    const { data: ownedData } = await supabase
      .from('user_skins')
      .select('skin_id')
      .eq('user_id', user.id);
    
    setUserSkins(ownedData?.map(o => o.skin_id) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SEC-02 FIX: Atomic server-side purchase via RPC (prevents race condition)
  const purchaseSkin = async (skinId, cost) => {
    if (!user) return { success: false, error: 'No authenticated user' };
    
    const { data, error } = await supabase.rpc('purchase_skin', { p_skin_id: skinId });
    
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error || 'Error desconocido' };

    // Refresh local state
    setUserSkins(prev => [...prev, skinId]);
    return { success: true, remainingPoints: data.remaining_points };
  };

  const addSkinAdmin = async (newSkin) => {
    const { data, error } = await supabase
      .from('skins')
      .insert([newSkin]);
    
    if (!error) fetchData();
    return { data, error };
  };

  const updateSkinAdmin = async (id, updatedSkin) => {
    const { error } = await supabase
      .from('skins')
      .update(updatedSkin)
      .eq('id', id);
    
    if (!error) fetchData();
    return { error };
  };

  const deleteSkinAdmin = async (id) => {
    // 1. First remove any references in user_skins to prevent foreign key constraint violations
    const { error: relError } = await supabase
      .from('user_skins')
      .delete()
      .eq('skin_id', id);
      
    if (relError) {
      console.error("Error removing user_skins references:", relError);
      // We can continue, but if it's a hard FK constraint, the next query will throw an error we return anyway.
    }

    // 2. Now delete the skin itself
    const { error } = await supabase
      .from('skins')
      .delete()
      .eq('id', id);
    
    if (!error) fetchData();
    return { error };
  };

  return (
    <SkinsContext.Provider value={{ 
      skins: allSkins, 
      userSkins, 
      loading, 
      purchaseSkin, 
      addSkinAdmin, 
      updateSkinAdmin,
      deleteSkinAdmin,
      refreshSkins: fetchData
    }}>
      {children}
    </SkinsContext.Provider>
  );
};

export const useSkins = () => {
  const context = useContext(SkinsContext);
  if (context === undefined) throw new Error('useSkins must be used within a SkinsProvider');
  return context;
};

export default SkinsContext;
