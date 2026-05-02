import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './data/AuthContext';
import { LiveProvider } from './data/LiveContext';
import { SkinsProvider } from './data/SkinsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

// Layouts (always loaded — small)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages — lazy loaded
const Home          = lazy(() => import('./pages/Home'));
const Categories    = lazy(() => import('./pages/Categories'));
const TeamPage      = lazy(() => import('./pages/TeamPage'));
const Login         = lazy(() => import('./pages/Login'));
const Onboarding    = lazy(() => import('./pages/Onboarding'));
const Streaming     = lazy(() => import('./pages/Streaming'));
const GalleryPublic = lazy(() => import('./pages/GalleryPublic'));

// Dashboard pages — lazy loaded (these are the heavy ones)
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const Players         = lazy(() => import('./pages/dashboard/Players'));
const CategoriesDash  = lazy(() => import('./pages/dashboard/CategoriesDash'));
const Attendance      = lazy(() => import('./pages/dashboard/Attendance'));
const Tactics         = lazy(() => import('./pages/dashboard/Tactics'));
const Finance         = lazy(() => import('./pages/dashboard/Finance'));
const Vouchers        = lazy(() => import('./pages/dashboard/Vouchers'));
const Calendar        = lazy(() => import('./pages/dashboard/Calendar'));
const Reports         = lazy(() => import('./pages/dashboard/Reports'));
const Stats           = lazy(() => import('./pages/dashboard/Stats'));
const SkinsManagement = lazy(() => import('./pages/dashboard/SkinsManagement'));
const CoachMessages   = lazy(() => import('./pages/dashboard/CoachMessages'));
const StreamingConfig = lazy(() => import('./pages/dashboard/StreamingConfig'));
const Trivia          = lazy(() => import('./pages/dashboard/Trivia'));
const Gallery         = lazy(() => import('./pages/dashboard/Gallery'));
const Profiles        = lazy(() => import('./pages/dashboard/Profiles'));

import './App.css';

// ── Loading fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '60vh', flexDirection: 'column', gap: '1rem'
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid rgba(56,189,248,0.2)',
      borderTopColor: '#38bdf8',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Cargando...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Layouts ──────────────────────────────────────────────────────────────────
const PublicLayout = ({ children }) => (
  <div className="public-container">
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);

// ── Route Guard ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Si está cargando la sesión, mostramos el cargador de página
  if (loading) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const userRole = (user?.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);
    
    if (!isAllowed) {
      return (
        <div className="unauthorized-page glass">
          <h1>Acceso Restringido</h1>
          <p>Tu rol ({userRole || 'sin rol'}) no tiene permisos para ver esta sección.</p>
          <button className="btn-primary" onClick={() => window.history.back()}>Regresar</button>
        </div>
      );
    }
  }

  return <DashboardLayout />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SkinsProvider>
            <LiveProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* ── RUTAS PÚBLICAS ── */}
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/categorias" element={<PublicLayout><Categories /></PublicLayout>} />
                <Route path="/categorias/:categoryId" element={<PublicLayout><TeamPage /></PublicLayout>} />
                <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
                <Route path="/onboarding" element={<PublicLayout><Onboarding /></PublicLayout>} />
                <Route path="/streaming" element={<PublicLayout><Streaming /></PublicLayout>} />
                <Route path="/galeria" element={<PublicLayout><GalleryPublic /></PublicLayout>} />

                {/* ── DASHBOARD (PROTEGIDO) ── */}
                <Route element={<ProtectedRoute allowedRoles={['superadmin','dt','contador','parent','player']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Administración */}
                  <Route path="/dashboard/usuarios"        element={<Players />} />
                  <Route path="/dashboard/perfiles"        element={<Profiles />} />
                  <Route path="/dashboard/categorias"      element={<CategoriesDash />} />
                  <Route path="/dashboard/asistencia"      element={<Attendance />} />
                  <Route path="/dashboard/tacticas"        element={<Tactics />} />
                  <Route path="/dashboard/el-profe-dice"   element={<CoachMessages />} />

                  {/* Financiero */}
                  <Route path="/dashboard/finanzas"        element={<Finance />} />
                  <Route path="/dashboard/vouchers"        element={<Vouchers />} />
                  <Route path="/dashboard/pagos"           element={<Finance />} />
                  <Route path="/dashboard/calendario"      element={<Calendar />} />
                  <Route path="/dashboard/reportes"        element={<Reports />} />

                  {/* Jugadores / Gamificación */}
                  <Route path="/dashboard/recompensas"     element={<SkinsManagement />} />
                  <Route path="/dashboard/trivia"          element={<Trivia />} />
                  <Route path="/dashboard/stats"           element={<Stats />} />

                  {/* Media / Streaming */}
                  <Route path="/dashboard/galeria"         element={<Gallery />} />
                  <Route path="/dashboard/streaming-config" element={<StreamingConfig />} />

                  {/* Placeholder */}
                  <Route path="/dashboard/config" element={<div style={{padding:'2rem',color:'#fff'}}>Configuración del Sistema — Próximamente</div>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </LiveProvider>
        </SkinsProvider>
      </AuthProvider>
    </BrowserRouter>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;
