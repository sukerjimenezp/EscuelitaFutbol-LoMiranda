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

  const purchaseSkin = async (skinId, cost) => {
    if (!user) return { success: false, error: 'No authenticated user' };
    
    // 1. Check points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if ((profile?.points || 0) < cost) {
      return { success: false, error: 'Puntos insuficientes' };
    }

    // 2. Add to inventory
    const { error: invError } = await supabase
      .from('user_skins')
      .insert({ user_id: user.id, skin_id: skinId });
    
    if (invError) return { success: false, error: invError.message };

    // 3. Deduct points
    await supabase
      .from('profiles')
      .update({ points: profile.points - cost })
      .eq('id', user.id);
    
    // 4. Refresh local state
    setUserSkins(prev => [...prev, skinId]);
    return { success: true };
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
