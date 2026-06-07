import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { PolicyProvider } from './context/PolicyContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Shop from './pages/Shop'
import Explore from './pages/Explore'
import Cart from './pages/Cart'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import PaymentSuccess from './pages/PaymentSuccess'
import VendorAdmin from './pages/VendorAdmin'
import SuperAdmin from './pages/SuperAdmin'
import SuperAdminVendors from './pages/SuperAdminVendors'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminRegister from './pages/SuperAdminRegister'

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

export default function App() {
  return (
    <ThemeProvider>
      <PolicyProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/explore/:brandName" element={<Explore />} />
              <Route path="/expore" element={<Explore />} />
              <Route path="/expore/:brandName" element={<Explore />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route
                path="/vendor-admin"
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SuperAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/vendors"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SuperAdminVendors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/:tab"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SuperAdmin />
                  </ProtectedRoute>
                }
              />
              <Route path="/super-admin-login" element={<SuperAdminLogin />} />
              <Route path="/super-admin-register" element={<SuperAdminRegister />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </PolicyProvider>
    </ThemeProvider>
  )
}
