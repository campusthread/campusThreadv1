import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PolicyProvider } from './context/PolicyContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Shop from './pages/Shop'
import Explore from './pages/Explore'
import Cart from './pages/Cart'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import PaymentSuccess from './pages/PaymentSuccess'
import ResetSuccess from './pages/ResetSuccess'
import VendorAdmin from './pages/VendorAdmin'
import RevenueReport from './pages/RevenueReport'
import SuperAdmin from './pages/SuperAdmin'
import SuperAdminCommission from './pages/SuperAdminCommission'
import SuperAdminVendors from './pages/SuperAdminVendors'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminRegister from './pages/SuperAdminRegister'
import HealthCheck from './pages/HealthCheck'

// Protected route component
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />
  }

  return children
}

const router = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/auth', element: <Auth /> },
    { path: '/shop', element: <Shop /> },
    { path: '/explore', element: <Explore /> },
    { path: '/health-check', element: <HealthCheck /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/reset-success', element: <ResetSuccess /> },
    { path: '/cart', element: <Cart /> },
    { path: '/favorites', element: <ProtectedRoute><Favorites /></ProtectedRoute> },
    { path: '/profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
    { path: '/product/:id', element: <ProductDetail /> },
    { path: '/checkout', element: <ProtectedRoute><Checkout /></ProtectedRoute> },
    { path: '/orders', element: <ProtectedRoute><OrderHistory /></ProtectedRoute> },
    { path: '/payment-success', element: <PaymentSuccess /> },
    { path: '/vendor-admin', element: <ProtectedRoute requiredRole="vendor"><VendorAdmin /></ProtectedRoute> },
    { path: '/vendor-admin/revenue', element: <ProtectedRoute requiredRole="vendor"><RevenueReport role="vendor" /></ProtectedRoute> },
    { path: '/super-admin', element: <ProtectedRoute requiredRole="admin"><SuperAdmin /></ProtectedRoute> },
    { path: '/super-admin/revenue', element: <ProtectedRoute requiredRole="admin"><RevenueReport role="admin" /></ProtectedRoute> },
    { path: '/super-admin/commission', element: <ProtectedRoute requiredRole="admin"><SuperAdminCommission /></ProtectedRoute> },
    { path: '/super-admin/vendors', element: <ProtectedRoute requiredRole="admin"><SuperAdminVendors /></ProtectedRoute> },
    { path: '/super-admin/:tab', element: <ProtectedRoute requiredRole="admin"><SuperAdmin /></ProtectedRoute> },
    { path: '/super-admin-login', element: <SuperAdminLogin /> },
    { path: '/super-admin-register', element: <SuperAdminRegister /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

export default function App() {
  return (
    <ThemeProvider>
      <PolicyProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </PolicyProvider>
    </ThemeProvider>
  )
}
