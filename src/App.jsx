import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './data/AuthContext';
import { LiveProvider } from './data/LiveContext';
import { SkinsProvider } from './data/SkinsContext';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';

// Páginas Públicas
import Home from './pages/Home';
import Categories from './pages/Categories';
import TeamPage from './pages/TeamPage';
import Login from './pages/Login';
import Streaming from './pages/Streaming';

// Páginas Dashboard
import Dashboard from './pages/Dashboard';
import Players from './pages/dashboard/Players';
import CategoriesDash from './pages/dashboard/CategoriesDash';
import Attendance from './pages/dashboard/Attendance';
import Tactics from './pages/dashboard/Tactics';
import Finance from './pages/dashboard/Finance';
import Calendar from './pages/dashboard/Calendar';
import Reports from './pages/dashboard/Reports';
import Stats from './pages/dashboard/Stats';
import SkinsManagement from './pages/dashboard/SkinsManagement';
import CoachMessages from './pages/dashboard/CoachMessages';
import StreamingConfig from './pages/dashboard/StreamingConfig';

import './App.css';

const PublicLayout = ({ children }) => (
  <div className="public-container">
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="unauthorized-page glass">
        <h1>Acceso Restringido</h1>
        <p>Tu rol no tiene permisos para ver esta sección.</p>
        <button className="btn-primary" onClick={() => window.history.back()}>Regresar</button>
      </div>
    );
  }
  
  return <DashboardLayout />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SkinsProvider>
          <LiveProvider>
            <Routes>
              {/* --- RUTAS PÚBLICAS --- */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/categorias" element={<PublicLayout><Categories /></PublicLayout>} />
              <Route path="/categorias/:categoryId" element={<PublicLayout><TeamPage /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
              <Route path="/streaming" element={<PublicLayout><Streaming /></PublicLayout>} />

              {/* --- RUTAS DASHBOARD (PROTEGIDAS) --- */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin', 'dt', 'contador', 'parent', 'player']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Gestión Administrativa y de Jugadores */}
                <Route path="/dashboard/usuarios" element={<Players />} />
                <Route path="/dashboard/categorias" element={<CategoriesDash />} />
                <Route path="/dashboard/asistencia" element={<Attendance />} />
                <Route path="/dashboard/tacticas" element={<Tactics />} />
                <Route path="/dashboard/el-profe-dice" element={<CoachMessages />} />
                
                {/* Gestión Financiera y Operativa */}
                <Route path="/dashboard/finanzas" element={<Finance />} />
                <Route path="/dashboard/calendario" element={<Calendar />} />
                <Route path="/dashboard/reportes" element={<Reports />} />
                <Route path="/dashboard/recompensas" element={<SkinsManagement />} />
                <Route path="/dashboard/streaming-config" element={<StreamingConfig />} />
                
                {/* Placeholders Finales */}
                <Route path="/dashboard/galeria" element={<div>Galería Multimedia - Próximamente</div>} />
                <Route path="/dashboard/config" element={<div>Configuración del Sistema - Próximamente</div>} />
                <Route path="/dashboard/pagos" element={<Finance />} />
                <Route path="/dashboard/stats" element={<Stats />} />
              </Route>

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LiveProvider>
        </SkinsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
