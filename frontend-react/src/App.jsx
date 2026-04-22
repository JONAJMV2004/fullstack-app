import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import SplashPage from './pages/SplashPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import RecompensasPage from './pages/RecompensasPage'
import TarjetaPage from './pages/TarjetaPage'
import DashboardPage from './pages/DashboardPage'
import AjustesPage from './pages/AjustesPage'
import AcercaPage from './pages/AcercaPage'
import CondicionesPage from './pages/CondicionesPage'
import SoportePage from './pages/SoportePage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import CambiarPasswordPage from './pages/CambiarPasswordPage'
import EditarPerfilPage from './pages/EditarPerfilPage'
import NotificacionesPage from './pages/NotificacionesPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import DataDeletionPage from './pages/DataDeletionPage'
import OlvidePasswordPage from './pages/OlvidePasswordPage'

import AdminReportesPage from './pages/admin/AdminReportesPage'
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage'
import AdminPuntosPage from './pages/admin/AdminPuntosPage'
import AdminCodigosPage from './pages/admin/AdminCodigosPage'
import AdminPremiosPage from './pages/admin/AdminPremiosPage'
import AdminCanjesPage from './pages/admin/AdminCanjesPage'
import AdminUbicacionesPage from './pages/admin/AdminUbicacionesPage'
import AdminMarketingPage from './pages/admin/AdminMarketingPage'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) {
    const dest = window.location.pathname + window.location.search
    if (dest !== '/login') sessionStorage.setItem('pendingRedirect', dest)
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.tipo_usuario !== 'admin') return <Navigate to="/home" replace />
  return children
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (isLoggedIn) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><SplashPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/recuperar-password" element={<PublicRoute><OlvidePasswordPage /></PublicRoute>} />
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
      <Route path="/oauth-callback.html" element={<OAuthCallbackPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      <Route path="/eliminacion-datos" element={<DataDeletionPage />} />

      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/recompensas" element={<ProtectedRoute><RecompensasPage /></ProtectedRoute>} />
      <Route path="/tarjeta" element={<ProtectedRoute><TarjetaPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/ajustes" element={<ProtectedRoute><AjustesPage /></ProtectedRoute>} />
      <Route path="/cambiar-password" element={<ProtectedRoute><CambiarPasswordPage /></ProtectedRoute>} />
      <Route path="/editar-perfil" element={<ProtectedRoute><EditarPerfilPage /></ProtectedRoute>} />
      <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />
      <Route path="/acerca" element={<ProtectedRoute><AcercaPage /></ProtectedRoute>} />
      <Route path="/condiciones" element={<ProtectedRoute><CondicionesPage /></ProtectedRoute>} />
      <Route path="/soporte" element={<ProtectedRoute><SoportePage /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminReportesPage /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />
      <Route path="/admin/puntos" element={<AdminRoute><AdminPuntosPage /></AdminRoute>} />
      <Route path="/admin/codigos" element={<AdminRoute><AdminCodigosPage /></AdminRoute>} />
      <Route path="/admin/premios" element={<AdminRoute><AdminPremiosPage /></AdminRoute>} />
      <Route path="/admin/canjes" element={<AdminRoute><AdminCanjesPage /></AdminRoute>} />
      <Route path="/admin/ubicaciones" element={<AdminRoute><AdminUbicacionesPage /></AdminRoute>} />
      <Route path="/admin/marketing"   element={<AdminRoute><AdminMarketingPage /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
