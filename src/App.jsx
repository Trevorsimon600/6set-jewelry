import { useEffect, useState } from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import TrevorCTO from './pages/TrevorCTO'

import {
  ShopSettingsProvider,
  useShopSettings,
} from './context/ShopSettingsContext'

import {
  fetchStorefrontProducts,
} from './lib/catalogService'

import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import StoreClosedScreen from './components/StoreClosedScreen'


// ============================================
// MAIN PAGES
// ============================================

import Home from './pages/Home'
import Shop from './pages/Shop'
import Categories from './pages/Categories'
import AllProducts from './pages/AllProducts'


// ============================================
// CATEGORY ROUTER
// ============================================

import CategoryRouter from './pages/CategoryRouter'


// ============================================
// PRODUCT
// ============================================

import ProductDetails from './pages/ProductDetails'


// ============================================
// CART / CHECKOUT
// ============================================

import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import OrderConfirmation from './pages/OrderConfirmation'


// ============================================
// ADMIN
// ============================================

import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'


// ============================================================
// STOREFRONT ROUTES
// ============================================================

function StorefrontRoutes({
  products,
  productsLoading,
  productsError,
}) {
  const { storeStatus } = useShopSettings()
  const { pathname } = useLocation()

  const isAdminRoute = pathname.startsWith('/admin')

  if (storeStatus === 'closed' && !isAdminRoute) {
    return <StoreClosedScreen />
  }

  return (
    <Routes>

      {/* ======================================
          HOME
      ====================================== */}

      <Route
        path="/"
        element={
          <Home />
        }
      />


      {/* ======================================
          SHOP
      ====================================== */}

      <Route
        path="/shop"
        element={
          <Shop
            products={products}
            loading={productsLoading}
            error={productsError}
          />
        }
      />


      {/* ======================================
          CATEGORIES
      ====================================== */}

      <Route
        path="/categories"
        element={
          <Categories />
        }
      />


      {/* ======================================
          ALL PRODUCTS
      ====================================== */}

      <Route
        path="/products"
        element={
          <AllProducts
            products={products}
            loading={productsLoading}
            error={productsError}
          />
        }
      />

      <Route
        path="/trevor-cto"
        element={
          <TrevorCTO />
        }
      />


      {/* ======================================
          DYNAMIC CATEGORY ROUTER

          Examples:

          /category/earrings
          /category/necklaces
          /category/bracelets
          /category/rings

          Future categories will also work
          through this route.
      ====================================== */}

      <Route
        path="/category/:categorySlug"
        element={
          <CategoryRouter />
        }
      />


      {/* ======================================
          PRODUCT DETAILS
      ====================================== */}

      <Route
        path="/product/:productId"
        element={
          <ProductDetails
            products={products}
            loading={productsLoading}
            error={productsError}
          />
        }
      />


      {/* ======================================
          CART
      ====================================== */}

      <Route
        path="/cart"
        element={
          <Cart />
        }
      />


      {/* ======================================
          CHECKOUT
      ====================================== */}

      <Route
        path="/checkout"
        element={
          <Checkout />
        }
      />


      {/* ======================================
          PAYMENT
      ====================================== */}

      <Route
        path="/payment"
        element={<Payment />}
      />


      {/* ======================================
          ORDER CONFIRMATION
      ====================================== */}

      <Route
        path="/order-confirmation"
        element={
          <OrderConfirmation />
        }
      />

    </Routes>
  )
}

// ============================================================
// ADMIN ROUTES
//
// IMPORTANT:
// These remain outside StorefrontRoutes
// so the admin can still be accessed
// when the shop is closed.
// ============================================================

function AdminRoutes() {

  return (
    <Routes>

      {/* ======================================
          ADMIN ENTRY
          /admin → Admin Login
      ====================================== */}

      <Route
        path="/admin"
        element={
          <AdminLogin />
        }
      />      

      {/* ======================================
          ADMIN LOGIN
      ====================================== */}

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />


      {/* ======================================
          ADMIN DASHBOARD
      ====================================== */}

      <Route
        path="/admin/dashboard"
        element={

          <ProtectedAdminRoute>

            <AdminDashboard />

          </ProtectedAdminRoute>

        }
      />

    </Routes>

  )

}

// ============================================================
// APPLICATION ROUTES
// ============================================================

function ApplicationRoutes({
  products,
  productsLoading,
  productsError,
}) {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return <AdminRoutes />
  }

  return (
    <StorefrontRoutes
      products={products}
      productsLoading={productsLoading}
      productsError={productsError}
    />
  )
}

// ============================================================
// MAIN APP
// ============================================================

function App() {


  // ==========================================
  // STOREFRONT PRODUCT STATE
  // ==========================================

  const [
    products,
    setProducts,
  ] = useState([])


  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true)


  const [
    productsError,
    setProductsError,
  ] = useState('')


  // ==========================================
  // LOAD STOREFRONT PRODUCTS
  // ==========================================

  useEffect(() => {

    let cancelled = false


    async function loadProducts() {

      try {

        setProductsLoading(true)

        setProductsError('')


        const storefrontProducts =
          await fetchStorefrontProducts()


        if (!cancelled) {

          setProducts(
            storefrontProducts || []
          )

        }

      } catch (error) {

        console.error(
          'Failed to load storefront products:',
          error
        )


        if (!cancelled) {

          setProductsError(
            error.message ||
              'Failed to load products.'
          )

          setProducts([])

        }

      } finally {

        if (!cancelled) {

          setProductsLoading(false)

        }

      }

    }


    loadProducts()


    return () => {

      cancelled = true

    }

  }, [])


  // ==========================================
  // APPLICATION
  // ==========================================

  return (
    <BrowserRouter>

      <AuthProvider>

        <CartProvider>

          <OrderProvider>
            <ShopSettingsProvider>
              <ApplicationRoutes
                products={products}
                productsLoading={productsLoading}
                productsError={productsError}
              />
            </ShopSettingsProvider>
          </OrderProvider>

        </CartProvider>

      </AuthProvider>

    </BrowserRouter>

  )

}

export default App