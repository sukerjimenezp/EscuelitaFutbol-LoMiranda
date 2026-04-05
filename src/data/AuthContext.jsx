import React, { createContext, useContext, useState, useEffect } from 'react';

// Importar avatares locales
import ramosImg from '../images/avatares/ramos.png';
import messiImg from '../images/avatares/messi.png';
import neymarImg from '../images/avatares/neymar.png';
import cristianoImg from '../images/avatares/cristiano.png';
import alexisImg from '../images/avatares/alexis.png';
import vidalImg from '../images/avatares/vidal.png';
import zamoranoImg from '../images/avatares/zamorano.png';
import salasImg from '../images/avatares/salas.png';

const AuthContext = createContext(null);

// Usuarios de prueba en memoria para todos los roles
const MOCK_USERS = [
  { id: 1, email: 'admin@lomiranda.cl', password: 'admin2026', name: 'Super Admin', role: 'superadmin', avatar: ramosImg },
  { id: 2, email: 'dt@lomiranda.cl', password: 'dt2026', name: 'Carlos Miranda', role: 'dt', category: 'sub10', avatar: messiImg },
  { id: 3, email: 'contador@lomiranda.cl', password: 'contador2026', name: 'Lucía Rivas', role: 'contador', avatar: neymarImg },
  { id: 4, email: 'padre@lomiranda.cl', username: 'padre', password: 'padre2026', name: 'Juan Pérez', role: 'parent', studentId: 5, avatar: cristianoImg },
  { id: 5, email: 'jugador@lomiranda.cl', username: 'mateo', password: 'jugador2026', name: 'Mateo Miranda', role: 'player', category: 'sub10', avatar: alexisImg },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('loriranda_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('loriranda_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('loriranda_user');
    }
  }, [user]);

  const login = (identifier, password) => {
    const found = MOCK_USERS.find(u => 
      (u.email === identifier.toLowerCase() || u.username === identifier.toLowerCase()) && 
      u.password === password
    );
    if (found) {
      setUser(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const logout = () => {
    setUser(null);
  };

  // Función útil para desarrollo/testing de DASHBOARD
  const switchRole = (role) => {
    const newUser = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setUser(newUser);
  };

  const updateUserAvatar = (newAvatarUrl) => {
    if (user) {
      setUser({ ...user, avatar: newAvatarUrl });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      switchRole,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
