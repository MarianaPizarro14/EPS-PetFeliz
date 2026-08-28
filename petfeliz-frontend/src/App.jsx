import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './components/pages/Home'
import Servicios from './components/pages/Servicios'
import Nosotros from './components/pages/Nosotros'
import Planes from './components/pages/Planes'
import Contacto from './components/pages/Contacto'
import KitDePrensa from './components/pages/KitPrensa'
import PoliticaPrivacidad from './components/pages/PoliticaPrivacidad'
import TerminosCondiciones from './components/pages/TerminosCondiciones'
import HistoriasCuidadores from './components/pages/HistoriasCuidadores'
import Emergencias from './components/pages/Emergencias'
import RedEspecialistas from './components/pages/RedEspecialistas'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import ForgotPassword from './components/pages/ForgotPassword'
import DashboardClient from './components/pages/DashboardClient'
import ServiciosCliente from './components/pages/ServiciosCliente'
import PagosCliente from './components/pages/PagosCliente'
import DocumentosCliente from './components/pages/DocumentosCliente'
import SoporteCliente from './components/pages/SoporteCliente'
import MisMascotas from './components/pages/MisMascotas'
import MisCitas from './components/pages/MisCitas'
import AgendarCitaFlow from './components/pages/AgendarCitaFlow'
import ResetPassword from './components/pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import AdminHistoriasCuidadores from './components/pages/AdminHistoriasCuidadores'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const APP_ROUTES = [
  '/dashboard-client', '/dashboard-cliente', '/dashboard-client/servicios', 
  '/servicios-cliente', '/dashboard-client/pagos', '/pagos', 
  '/dashboard-client/documentos', '/documentos', '/dashboard-client/soporte', 
  '/soporte', '/mis-mascotas', '/citas', '/agendar-cita',
  '/admin/historias', '/admin/historias-cuidadores'
]

function AppContent() {
  const { pathname } = useLocation()
  const isAuthPage = AUTH_ROUTES.includes(pathname)
  const isAppPage = APP_ROUTES.includes(pathname)
  const hideChrome = isAuthPage || isAppPage

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/"                         element={<Home />} />
        <Route path="/servicios"                element={<Servicios />} />
        <Route path="/nosotros"                 element={<Nosotros />} />
        <Route path="/planes"                   element={<Planes />} />
        <Route path="/contacto"                 element={<Contacto />} />
        <Route path="/kit-de-prensa"            element={<KitDePrensa />} />
        <Route path="/politica-privacidad"      element={<PoliticaPrivacidad />} />
        <Route path="/terminos-condiciones"     element={<TerminosCondiciones />} />
        <Route path="/historias-cuidadores"     element={<HistoriasCuidadores />} />
        <Route path="/emergencias"              element={<Emergencias />} />
        <Route path="/red-especialistas"        element={<RedEspecialistas />} />
        <Route path="/login"                    element={<Login />} />
        <Route path="/register"                 element={<Register />} />
        <Route path="/forgot-password"          element={<ForgotPassword />} />
        <Route path="/reset-password"           element={<ResetPassword />} />
        <Route path="/admin/historias"          element={<AdminHistoriasCuidadores />} />
        <Route path="/admin/historias/:id"      element={<AdminHistoriasCuidadores />} />
        <Route path="/admin/historias-cuidadores" element={<AdminHistoriasCuidadores />} />
        <Route
          path="/dashboard-client"
          element={
            <ProtectedRoute>
              <DashboardClient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-cliente"
          element={
            <ProtectedRoute>
              <DashboardClient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-client/servicios"
          element={
            <ProtectedRoute>
              <ServiciosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicios-cliente"
          element={
            <ProtectedRoute>
              <ServiciosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-client/pagos"
          element={
            <ProtectedRoute>
              <PagosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagos"
          element={
            <ProtectedRoute>
              <PagosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-client/documentos"
          element={
            <ProtectedRoute>
              <DocumentosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documentos"
          element={
            <ProtectedRoute>
              <DocumentosCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-client/soporte"
          element={
            <ProtectedRoute>
              <SoporteCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/soporte"
          element={
            <ProtectedRoute>
              <SoporteCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-mascotas"
          element={
            <ProtectedRoute>
              <MisMascotas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas"
          element={
            <ProtectedRoute>
              <MisCitas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agendar-cita"
          element={
            <ProtectedRoute>
              <AgendarCitaFlow />
            </ProtectedRoute>
          }
        />
      </Routes>

      {!hideChrome && <Footer />}
    </>
  )
}

import { UserProvider } from './context/UserContext'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </BrowserRouter>
  )
}

export default App