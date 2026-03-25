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

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
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
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
