import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

import {
  fetchAdminData,
  getOrderId,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderItemsCount,
  getOrderStatus,
  getPaymentStatus,
  getAdminOrderDate,
  getValidDate,
  getRecentOrders,
  getVerifiedOrders,
  getCustomerOrders,
  getCustomerAverageOrder,
  getAdminSalesSummary,
  getProductStatistics,
  getStoreHealthStatus,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  safeNumber,
  safeArray,
} from '../lib/adminService'

import {
  getSalesSummary,
  getOrderTotal,
  getOrderDate,
  getOrderItemsSold,
  isVerifiedOrder,
} from '../services/sales.js'

import { fetchBestSellers } from '../lib/catalogService'
import { exportToCSV } from '../lib/csvExport'

import AdminProducts from './AdminProducts'
import AdminCategories from './AdminCategories'
import AdminSettings from './AdminSettings'
import AdminOrders from './AdminOrders'

import './AdminAuth.css'


/* ============================================================
   6SET JEWELRY
   ADMIN DASHBOARD
============================================================ */

function AdminDashboard() {
  const navigate = useNavigate()

  const {
    user,
    signOut,
    loading: authLoading,
  } = useAuth()


  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const [
    activeSection,
    setActiveSection,
  ] = useState('Dashboard')


  /* ==========================================================
     DATABASE DATA
  ========================================================== */

  const [
    products,
    setProducts,
  ] = useState([])

  const [
    categories,
    setCategories,
  ] = useState([])

  const [
    orders,
    setOrders,
  ] = useState([])

  const [
    customers,
    setCustomers,
  ] = useState([])


  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null)

  const [
    bestSellers,
    setBestSellers,
  ] = useState([])

  const [
    bestSellersLoading,
    setBestSellersLoading,
  ] = useState(true)


  /* ==========================================================
     NAVIGATION ITEMS
  ========================================================== */

  const navigationItems = [
    'Dashboard',
    'Products',
    'Categories',
    'Inventory',
    'Orders',
    'Customers',
    'Settings',
  ]


  /* ==========================================================
     EXPORT CUSTOMERS TO CSV
  ========================================================== */

  function handleExportCustomers() {
    const rows = customers.map((customer) => ({
      name: customer?.name || '',
      phone: customer?.phone || '',
      location: customer?.location || '',
      total_orders: safeNumber(
        customer?.total_orders
      ),
      total_spent: safeNumber(
        customer?.total_spent
      ),
      last_order_at:
        customer?.last_order_at || '',
    }))

    exportToCSV(rows, 'customers.csv')
  }


  /* ==========================================================
     LOAD ADMIN DATA
     
     IMPORTANT:
     All database fetching is delegated to adminService.js.
     
     AdminDashboard.jsx should not directly query Supabase.
  ========================================================== */

  const loadAdminData = async ({
    showRefreshState = true,
  } = {}) => {
    if (showRefreshState) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const result =
        await fetchAdminData()


      /*
        Support the expected adminService response:

        {
          products: [],
          categories: [],
          orders: [],
          customers: []
        }

        Also safely support missing arrays.
      */

      const nextProducts =
        safeArray(
          result?.products
        )

      const nextCategories =
        safeArray(
          result?.categories
        )

      const nextOrders =
        safeArray(
          result?.orders
        )

      const nextCustomers =
        safeArray(
          result?.customers
        )


      setProducts(
        nextProducts
      )

      setCategories(
        nextCategories
      )

      setOrders(
        nextOrders
      )

      setCustomers(
        nextCustomers
      )

    } catch (loadError) {
      console.error(
        'Admin dashboard loading error:',
        loadError
      )

      setError(
        loadError?.message ||
        'Unable to load admin dashboard data.'
      )

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (authLoading) {
      return
    }

    loadAdminData({
      showRefreshState: false,
    })
  }, [authLoading])


  /* ==========================================================
     LOAD BEST SELLERS

     Reads from the best_sellers Supabase view (Completed
     orders only). Independent of loadAdminData so a failure
     here never blocks the rest of the dashboard.
  ========================================================== */

  useEffect(() => {
    let isCurrent = true

    async function loadBestSellers() {
      setBestSellersLoading(true)

      try {
        const data = await fetchBestSellers(5)

        if (isCurrent) {
          setBestSellers(safeArray(data))
        }
      } catch (bestSellersError) {
        console.error(
          'Failed to load best sellers:',
          bestSellersError
        )

        if (isCurrent) {
          setBestSellers([])
        }
      } finally {
        if (isCurrent) {
          setBestSellersLoading(false)
        }
      }
    }

    loadBestSellers()

    return () => {
      isCurrent = false
    }
  }, [])


  /* ==========================================================
     PRODUCT STATISTICS
     
     Based on the real products table:

     current_stock
     low_stock_threshold
     published
  ========================================================== */

  const productStatistics =
    useMemo(() => {
      try {
        return (
          getProductStatistics(
            products
          ) || {}
        )
      } catch (statisticsError) {
        console.error(
          'Product statistics error:',
          statisticsError
        )

        return {}
      }
    }, [products])


  const totalProducts =
    safeNumber(
      productStatistics?.totalProducts ??
      products.length
    )


  const activeProducts =
    safeNumber(
      productStatistics?.activeProducts ??
      products.filter(
        (product) =>
          product?.published !== false
      ).length
    )


  /* ==========================================================
     LOW STOCK PRODUCTS
     
     IMPORTANT:
     Uses the actual database columns:

     current_stock
     low_stock_threshold
  ========================================================== */

  const lowStockProductList =
    useMemo(() => {
      return products.filter(
        (product) => {
          const stock =
            safeNumber(
              product?.current_stock
            )

          const threshold =
            safeNumber(
              product?.low_stock_threshold
            )

          return (
            stock > 0 &&
            stock <= threshold
          )
        }
      )
    }, [products])


  /* ==========================================================
     OUT OF STOCK
  ========================================================== */

  const outOfStockProductList =
    useMemo(() => {
      return products.filter(
        (product) =>
          safeNumber(
            product?.current_stock
          ) <= 0
      )
    }, [products])


  const lowStockProducts =
    lowStockProductList.length


  const outOfStockProducts =
    outOfStockProductList.length


  /* ==========================================================
     SALES SUMMARY
     
     sales.js is responsible for determining verified sales.

     Only:
       Payment Verified

     counts as a sale.
  ========================================================== */

  const salesSummary =
    useMemo(() => {
      try {
        return (
          getSalesSummary(
            orders
          ) || {}
        )
      } catch (salesError) {
        console.error(
          'Sales summary error:',
          salesError
        )

        return {}
      }
    }, [orders])


  const totalSales =
    safeNumber(
      salesSummary?.totalSales
    )


  const paidOrders =
    safeNumber(
      salesSummary?.paidOrders
    )


  const itemsSold =
    safeNumber(
      salesSummary?.itemsSold
    )


  const averageOrderValue =
    safeNumber(
      salesSummary?.averageOrderValue
    )


  const todaySales =
    safeNumber(
      salesSummary?.today?.sales
    )


  const todayItems =
    safeNumber(
      salesSummary?.today?.itemsSold
    )


  const todayOrders =
    safeNumber(
      salesSummary?.today?.orders
    )


  const weekSales =
    safeNumber(
      salesSummary?.week?.sales
    )


  const weekItems =
    safeNumber(
      salesSummary?.week?.itemsSold
    )


  const weekOrders =
    safeNumber(
      salesSummary?.week?.orders
    )


  const monthSales =
    safeNumber(
      salesSummary?.month?.sales
    )


  const monthItems =
    safeNumber(
      salesSummary?.month?.itemsSold
    )


  const monthOrders =
    safeNumber(
      salesSummary?.month?.orders
    )


  /* ==========================================================
     VERIFIED ORDERS
  ========================================================== */

  const verifiedOrderList =
    useMemo(() => {
      try {
        return getVerifiedOrders(
          orders
        )
          .slice()
          .sort(
            (a, b) => {
              const dateA =
                getValidDate(
                  getAdminOrderDate(a)
                )?.getTime() || 0

              const dateB =
                getValidDate(
                  getAdminOrderDate(b)
                )?.getTime() || 0

              return dateB - dateA
            }
          )
      } catch {
        return orders
          .filter(
            (order) =>
              isVerifiedOrder(order)
          )
          .slice()
      }
    }, [orders])


  /* ==========================================================
     RECENT ORDERS
  ========================================================== */

  const recentOrderList =
    useMemo(() => {
      try {
        return getRecentOrders(
          orders,
          8
        ) || []
      } catch {
        return orders
          .slice()
          .sort(
            (a, b) => {
              const dateA =
                getValidDate(
                  getAdminOrderDate(a)
                )?.getTime() || 0

              const dateB =
                getValidDate(
                  getAdminOrderDate(b)
                )?.getTime() || 0

              return dateB - dateA
            }
          )
          .slice(0, 8)
      }
    }, [orders])


  /* ==========================================================
     CUSTOMER STATISTICS
  ========================================================== */

  const totalCustomerOrders =
    useMemo(() => {
      return customers.reduce(
        (total, customer) =>
          total +
          safeNumber(
            customer?.total_orders
          ),
        0
      )
    }, [customers])


  const totalCustomerSpending =
    useMemo(() => {
      return customers.reduce(
        (total, customer) =>
          total +
          safeNumber(
            customer?.total_spent
          ),
        0
      )
    }, [customers])


  /* ==========================================================
     CUSTOMER ORDER HISTORY
  ========================================================== */

  const selectedCustomerOrders =
    useMemo(() => {
      if (!selectedCustomer) {
        return []
      }

      try {
        return (
          getCustomerOrders(
            orders,
            selectedCustomer
          ) || []
        )
      } catch {
        return orders.filter(
          (order) => {
            const customerId =
              selectedCustomer?.id

            const customerPhone =
              String(
                selectedCustomer?.phone ||
                ''
              ).trim()

            const orderCustomerId =
              order?.customer_id

            const orderPhone =
              String(
                getOrderCustomerPhone(
                  order
                ) || ''
              ).trim()

            return (
              (
                customerId &&
                orderCustomerId &&
                String(
                  customerId
                ) ===
                  String(
                    orderCustomerId
                  )
              ) ||
              (
                customerPhone &&
                orderPhone &&
                customerPhone ===
                  orderPhone
              )
            )
          }
        )
      }
    }, [
      selectedCustomer,
      orders,
    ])


  /* ==========================================================
     CUSTOMER AVERAGE ORDER
  ========================================================== */

  const getCustomerAverage =
    (customer) => {
      try {
        return safeNumber(
          getCustomerAverageOrder(
            customer
          )
        )
      } catch {
        const totalOrders =
          safeNumber(
            customer?.total_orders
          )

        const totalSpent =
          safeNumber(
            customer?.total_spent
          )

        return totalOrders > 0
          ? totalSpent / totalOrders
          : 0
      }
    }


  /* ==========================================================
     STORE HEALTH
  ========================================================== */

  const storeHealth =
    useMemo(() => {
      try {
        return (
          getStoreHealthStatus(
            products
          ) ||
          'Healthy'
        )
      } catch {
        if (
          outOfStockProducts > 0
        ) {
          return 'Needs Attention'
        }

        if (
          lowStockProducts > 0
        ) {
          return 'Healthy — Monitor Stock'
        }

        return 'Healthy'
      }
    }, [
      products,
      lowStockProducts,
      outOfStockProducts,
    ])


  /* ==========================================================
     CATEGORY RENAMED
  ========================================================== */

  const handleCategoryRenamed = (
    oldName,
    newName
  ) => {
    setProducts(
      (currentProducts) =>
        currentProducts.map(
          (product) => {
            if (
              product?.category ===
              oldName
            ) {
              return {
                ...product,
                category: newName,
              }
            }

            return product
          }
        )
    )
  }


  /* ==========================================================
     NAVIGATION HANDLER
  ========================================================== */

  const handleSectionChange =
    (section) => {
      setActiveSection(
        section
      )

      if (
        section !==
        'Customers'
      ) {
        setSelectedCustomer(
          null
        )
      }
    }


  /* ==========================================================
     LOGOUT
  ========================================================== */

  async function handleLogout() {
    try {
      await signOut()

      navigate('/admin/login', { replace: true })
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      )
    }
  }


  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="admin-page">

        <div className="admin-shell">

          <main className="admin-main">

            <div className="admin-placeholder-panel">

              <h2>
                Loading Admin Dashboard...
              </h2>

              <p>
                Loading products, categories,
                orders, customers and sales data.
              </p>

            </div>

          </main>

        </div>

      </div>
    )
  }


  /* ==========================================================
     MAIN DASHBOARD
  ========================================================== */

  return (
    <div className="admin-page">

      <div className="admin-shell">


        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside className="admin-sidebar">

          <div className="admin-sidebar-header">

            <p className="section-label">
              6SET JEWELRY
            </p>

            <h1>
              Admin
            </h1>

            <p>
              Store Management
            </p>

          </div>


          <nav className="admin-navigation">

            {navigationItems.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    activeSection === item
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    handleSectionChange(
                      item
                    )
                  }
                >
                  {item}
                </button>
              )
            )}

          </nav>


          <div
            style={{
              marginTop: 'auto',
              paddingTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >

            <button
              type="button"
              className="admin-action-button secondary"
              onClick={() =>
                navigate('/')
              }
            >
              View Store
            </button>

            <button
              type="button"
              className="admin-action-button secondary"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </aside>


        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="admin-content">


          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="admin-header">

            <div>

              <p className="section-label">
                6SET JEWELRY ADMIN
              </p>

              <h1>
                {activeSection}
              </h1>

              <p>
                Manage your jewelry store,
                inventory, customers and sales.
              </p>

            </div>


            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >

              <button
                type="button"
                className="admin-action-button secondary"
                onClick={() =>
                  loadAdminData()
                }
                disabled={
                  refreshing
                }
              >
                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh Data'}
              </button>

            </div>

          </header>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className="admin-placeholder-panel"
              style={{
                marginBottom:
                  '1.5rem',
              }}
            >

              <h3>
                Data Loading Issue
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                className="admin-action-button"
                onClick={() =>
                  loadAdminData()
                }
                disabled={
                  refreshing
                }
              >
                {refreshing
                  ? 'Retrying...'
                  : 'Try Again'}
              </button>

            </div>

          )}


          <main className="admin-main">


            {/* =================================================
                DASHBOARD
            ================================================= */}

            {activeSection ===
              'Dashboard' && (

              <>

                {/* ============================================
                    PRIMARY KPIs
                ============================================ */}

                <div className="admin-dashboard-grid">

                  <div className="stat-card highlight">

                    <span>
                      Total Sales
                    </span>

                    <strong>
                      {formatCurrency(
                        totalSales
                      )}
                    </strong>

                    <small>
                      Verified sales only
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      Today's Sales
                    </span>

                    <strong>
                      {formatCurrency(
                        todaySales
                      )}
                    </strong>

                    <small>
                      {todayOrders} orders · {todayItems} items
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      This Week
                    </span>

                    <strong>
                      {formatCurrency(
                        weekSales
                      )}
                    </strong>

                    <small>
                      {weekOrders} orders · {weekItems} items
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      This Month
                    </span>

                    <strong>
                      {formatCurrency(
                        monthSales
                      )}
                    </strong>

                    <small>
                      {monthOrders} orders · {monthItems} items
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      Verified Orders
                    </span>

                    <strong>
                      {paidOrders}
                    </strong>

                    <small>
                      Payment verified
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      Items Sold
                    </span>

                    <strong>
                      {itemsSold}
                    </strong>

                    <small>
                      From verified orders
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      Average Order
                    </span>

                    <strong>
                      {formatCurrency(
                        averageOrderValue
                      )}
                    </strong>

                    <small>
                      Verified order average
                    </small>

                  </div>


                  <div className="stat-card">

                    <span>
                      Store Health
                    </span>

                    <strong>
                      {storeHealth}
                    </strong>

                    <small>
                      {outOfStockProducts > 0
                        ? `${outOfStockProducts} out of stock`
                        : lowStockProducts > 0
                          ? `${lowStockProducts} low stock`
                          : 'Inventory healthy'}
                    </small>

                  </div>

                </div>


                {/* ============================================
                    BUSINESS SNAPSHOT
                ============================================ */}

                <div className="admin-shell-section">

                  <p className="section-label">
                    BUSINESS SNAPSHOT
                  </p>

                  <h2>
                    Store Overview
                  </h2>

                  <p>
                    Current catalog, customer and
                    inventory position.
                  </p>


                  <div
                    className="admin-dashboard-grid"
                    style={{
                      marginTop:
                        '1.25rem',
                    }}
                  >

                    <div className="stat-card">

                      <span>
                        Products
                      </span>

                      <strong>
                        {totalProducts}
                      </strong>

                      <small>
                        {activeProducts} published
                      </small>

                    </div>


                    <div className="stat-card">

                      <span>
                        Categories
                      </span>

                      <strong>
                        {categories.length}
                      </strong>

                      <small>
                        Store categories
                      </small>

                    </div>


                    <div className="stat-card">

                      <span>
                        Customers
                      </span>

                      <strong>
                        {customers.length}
                      </strong>

                      <small>
                        Customer records
                      </small>

                    </div>


                    <div className="stat-card">

                      <span>
                        Orders
                      </span>

                      <strong>
                        {orders.length}
                      </strong>

                      <small>
                        All order records
                      </small>

                    </div>

                  </div>

                </div>


                {/* ============================================
                    SALES OVERVIEW
                ============================================ */}

                <div className="admin-shell-section">

                  <p className="section-label">
                    SALES PERFORMANCE
                  </p>

                  <h2>
                    Sales Overview
                  </h2>

                  <p>
                    Sales are calculated from orders
                    whose payment status is
                    <strong>
                      {' '}Payment Verified
                    </strong>.
                  </p>


                  <div
                    className="admin-dashboard-grid"
                    style={{
                      marginTop:
                        '1.25rem',
                    }}
                  >

                    <div className="stat-card">

                      <span>
                        Today
                      </span>

                      <strong>
                        {formatCurrency(
                          todaySales
                        )}
                      </strong>

                      <small>
                        {todayOrders} verified orders
                      </small>

                    </div>


                    <div className="stat-card">

                      <span>
                        7 Days
                      </span>

                      <strong>
                        {formatCurrency(
                          weekSales
                        )}
                      </strong>

                      <small>
                        {weekOrders} verified orders
                      </small>

                    </div>


                    <div className="stat-card">

                      <span>
                        30 Days
                      </span>

                      <strong>
                        {formatCurrency(
                          monthSales
                        )}
                      </strong>

                      <small>
                        {monthOrders} verified orders
                      </small>

                    </div>

                  </div>

                </div>


                {/* ============================================
                    RECENT ORDERS
                ============================================ */}

                <div className="admin-shell-section">

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      gap:
                        '1rem',
                      marginBottom:
                        '1rem',
                      flexWrap:
                        'wrap',
                    }}
                  >

                    <div>

                      <p className="section-label">
                        RECENT ACTIVITY
                      </p>

                      <h2>
                        Recent Orders
                      </h2>

                    </div>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Orders'
                        )
                      }
                    >
                      View All Orders
                    </button>

                  </div>


                  {recentOrderList.length ===
                  0 ? (

                    <div className="admin-placeholder-panel">

                      <h3>
                        No orders yet
                      </h3>

                      <p>
                        Orders will appear here
                        when customers place them.
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        width:
                          '100%',
                        overflowX:
                          'auto',
                      }}
                    >

                      <table
                        style={{
                          width:
                            '100%',
                          borderCollapse:
                            'collapse',
                          minWidth:
                            '800px',
                        }}
                      >

                        <thead>

                          <tr>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Order
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Customer
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'center',
                                padding:
                                  '1rem',
                              }}
                            >
                              Items
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'right',
                                padding:
                                  '1rem',
                              }}
                            >
                              Total
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Payment
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Status
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Date
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {recentOrderList.map(
                            (order) => (

                              <tr
                                key={
                                  `recent-${getOrderId(
                                    order
                                  )}`
                                }
                              >

                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  <strong>
                                    #
                                    {String(
                                      order?.order_number ||
                                      getOrderId(
                                        order
                                      )
                                    ).slice(
                                      0,
                                      14
                                    )}
                                  </strong>
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  {getOrderCustomerName(
                                    order
                                  )}
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                    textAlign:
                                      'center',
                                  }}
                                >
                                  {getOrderItemsCount(
                                    order
                                  )}
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                    textAlign:
                                      'right',
                                  }}
                                >
                                  <strong>
                                    {formatCurrency(
                                      getOrderTotal(
                                        order
                                      )
                                    )}
                                  </strong>
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  {formatStatus(
                                    getPaymentStatus(
                                      order
                                    )
                                  )}
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  {formatStatus(
                                    getOrderStatus(
                                      order
                                    )
                                  )}
                                </td>


                                <td
                                  style={{
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  {formatDate(
                                    getAdminOrderDate(
                                      order
                                    )
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


                {/* ============================================
                    INVENTORY ALERT
                ============================================ */}

                <div className="admin-shell-section">

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      gap:
                        '1rem',
                      marginBottom:
                        '1rem',
                      flexWrap:
                        'wrap',
                    }}
                  >

                    <div>

                      <p className="section-label">
                        INVENTORY ALERT
                      </p>

                      <h2>
                        Stock Requiring Attention
                      </h2>

                    </div>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Inventory'
                        )
                      }
                    >
                      View Inventory
                    </button>

                  </div>


                  {lowStockProductList.length ===
                  0 &&
                  outOfStockProductList.length ===
                  0 ? (

                    <div className="admin-placeholder-panel">

                      <h3>
                        Inventory looks healthy
                      </h3>

                      <p>
                        No products currently
                        require stock attention.
                      </p>

                    </div>

                  ) : (

                    <div className="admin-dashboard-grid">

                      {[
                        ...outOfStockProductList,
                        ...lowStockProductList,
                      ]
                        .filter(
                          (
                            product,
                            index,
                            array
                          ) =>
                            array.findIndex(
                              (item) =>
                                item?.id ===
                                product?.id
                            ) === index
                        )
                        .slice(0, 8)
                        .map(
                          (product) => {

                            const stock =
                              safeNumber(
                                product?.current_stock
                              )

                            const threshold =
                              safeNumber(
                                product?.low_stock_threshold
                              )

                            return (

                              <div
                                className="stat-card"
                                key={
                                  product?.id ||
                                  product?.name
                                }
                              >

                                <span>
                                  {
                                    product?.name ||
                                    'Unnamed Product'
                                  }
                                </span>

                                <strong>
                                  {stock}
                                </strong>

                                <small>
                                  {stock <= 0
                                    ? 'Out of stock'
                                    : `Low stock · threshold ${threshold}`}
                                </small>

                              </div>

                            )
                          }
                        )}

                    </div>

                  )}

                </div>


                {/* ============================================
                    VERIFIED SALES
                ============================================ */}

                <div className="admin-shell-section">

                  <p className="section-label">
                    SALES ACTIVITY
                  </p>

                  <h2>
                    Verified Sales
                  </h2>


                  {verifiedOrderList.length ===
                  0 ? (

                    <div className="admin-placeholder-panel">

                      <h3>
                        No verified sales yet
                      </h3>

                      <p>
                        Orders will appear here
                        after their payments are
                        verified.
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        width:
                          '100%',
                        overflowX:
                          'auto',
                        marginTop:
                          '1rem',
                      }}
                    >

                      <table
                        style={{
                          width:
                            '100%',
                          borderCollapse:
                            'collapse',
                          minWidth:
                            '750px',
                        }}
                      >

                        <thead>

                          <tr>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Order
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Customer
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'center',
                                padding:
                                  '1rem',
                              }}
                            >
                              Items
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'right',
                                padding:
                                  '1rem',
                              }}
                            >
                              Total
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Date
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {verifiedOrderList
                            .slice(0, 8)
                            .map(
                              (order) => (

                                <tr
                                  key={
                                    `verified-${getOrderId(
                                      order
                                    )}`
                                  }
                                >

                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    <strong>
                                      #
                                      {String(
                                        order?.order_number ||
                                        getOrderId(
                                          order
                                        )
                                      ).slice(
                                        0,
                                        14
                                      )}
                                    </strong>
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    {getOrderCustomerName(
                                      order
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                      textAlign:
                                        'center',
                                    }}
                                  >
                                    {getOrderItemsCount(
                                      order
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                      textAlign:
                                        'right',
                                    }}
                                  >
                                    <strong>
                                      {formatCurrency(
                                        getOrderTotal(
                                          order
                                        )
                                      )}
                                    </strong>
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    {formatDateTime(
                                      getAdminOrderDate(
                                        order
                                      )
                                    )}
                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


                {/* ============================================
                    BEST SELLERS
                ============================================ */}

                <div className="admin-shell-section">

                  <p className="section-label">
                    BEST SELLERS
                  </p>

                  {bestSellersLoading ? (

                    <p>
                      Loading best sellers...
                    </p>

                  ) : bestSellers.length === 0 ? (

                    <div className="admin-placeholder-panel">

                      <h3>
                        No Sales Yet
                      </h3>

                      <p>
                        Best sellers are calculated
                        from completed orders.
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        width: '100%',
                        overflowX: 'auto',
                      }}
                    >

                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          minWidth: '500px',
                        }}
                      >

                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '1rem',
                              }}
                            >
                              Product
                            </th>

                            <th
                              style={{
                                textAlign: 'center',
                                padding: '1rem',
                              }}
                            >
                              Units Sold
                            </th>

                            <th
                              style={{
                                textAlign: 'right',
                                padding: '1rem',
                              }}
                            >
                              Revenue
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {bestSellers.map(
                            (item) => (
                              <tr
                                key={item.product_id}
                              >
                                <td
                                  style={{
                                    padding: '1rem',
                                  }}
                                >
                                  <strong>
                                    {item.name}
                                  </strong>

                                  {item.product_code && (
                                    <div>
                                      <small>
                                        {item.product_code}
                                      </small>
                                    </div>
                                  )}
                                </td>

                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                  }}
                                >
                                  {safeNumber(
                                    item.units_sold
                                  )}
                                </td>

                                <td
                                  style={{
                                    padding: '1rem',
                                    textAlign: 'right',
                                  }}
                                >
                                  <strong>
                                    {formatCurrency(
                                      item.revenue
                                    )}
                                  </strong>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


                {/* ============================================
                    QUICK ACTIONS
                ============================================ */}

                <div className="admin-shell-section">

                  <p className="section-label">
                    QUICK ACTIONS
                  </p>

                  <div className="admin-placeholder-actions">

                    <button
                      type="button"
                      className="admin-action-button"
                      onClick={() =>
                        setActiveSection(
                          'Products'
                        )
                      }
                    >
                      + Add Product
                    </button>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Products'
                        )
                      }
                    >
                      Products
                    </button>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Categories'
                        )
                      }
                    >
                      Categories
                    </button>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Orders'
                        )
                      }
                    >
                      Orders
                    </button>


                    <button
                      type="button"
                      className="admin-action-button secondary"
                      onClick={() =>
                        setActiveSection(
                          'Customers'
                        )
                      }
                    >
                      Customers
                    </button>

                  </div>

                </div>

              </>

            )}


            {/* =================================================
                PRODUCTS
            ================================================= */}

            {activeSection ===
              'Products' && (

              <div className="admin-products-panel">

                <AdminProducts
                  products={
                    products
                  }
                  setProducts={
                    setProducts
                  }
                  categories={
                    categories
                  }
                />

              </div>

            )}


            {/* =================================================
                CATEGORIES
            ================================================= */}

            {activeSection ===
              'Categories' && (

              <div className="admin-categories-panel">

                <AdminCategories
                  products={
                    products
                  }
                  setProducts={
                    setProducts
                  }
                  categories={
                    categories
                  }
                  setCategories={
                    setCategories
                  }
                  onCategoryRenamed={
                    handleCategoryRenamed
                  }
                />

              </div>

            )}


            {/* =================================================
                ORDERS
            ================================================= */}

            {activeSection ===
              'Orders' && (

              <div className="admin-orders-panel">

                <AdminOrders />

              </div>

            )}


            {/* =================================================
                SETTINGS
            ================================================= */}

            {activeSection ===
              'Settings' && (

              <div className="admin-settings-panel">

                <AdminSettings />

              </div>

            )}


            {/* =================================================
                INVENTORY
            ================================================= */}

            {activeSection ===
              'Inventory' && (

              <>

                <div className="admin-shell-section">

                  <p className="section-label">
                    INVENTORY
                  </p>

                  <h2>
                    Inventory Management
                  </h2>

                  <p>
                    Inventory values are read from
                    the products table.
                  </p>


                  <div className="admin-dashboard-grid">

                    <div className="stat-card">

                      <span>
                        Total Products
                      </span>

                      <strong>
                        {totalProducts}
                      </strong>

                    </div>


                    <div className="stat-card">

                      <span>
                        Published Products
                      </span>

                      <strong>
                        {activeProducts}
                      </strong>

                    </div>


                    <div className="stat-card">

                      <span>
                        Low Stock
                      </span>

                      <strong>
                        {lowStockProducts}
                      </strong>

                    </div>


                    <div className="stat-card">

                      <span>
                        Out of Stock
                      </span>

                      <strong>
                        {outOfStockProducts}
                      </strong>

                    </div>

                  </div>

                </div>


                <div className="admin-shell-section">

                  <p className="section-label">
                    INVENTORY STATUS
                  </p>

                  <h2>
                    Products
                  </h2>


                  {products.length ===
                  0 ? (

                    <div className="admin-placeholder-panel">

                      <h3>
                        No products found
                      </h3>

                      <p>
                        Add products from the
                        Products section.
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        width:
                          '100%',
                        overflowX:
                          'auto',
                      }}
                    >

                      <table
                        style={{
                          width:
                            '100%',
                          borderCollapse:
                            'collapse',
                          minWidth:
                            '900px',
                        }}
                      >

                        <thead>

                          <tr>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Product
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Code
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'right',
                                padding:
                                  '1rem',
                              }}
                            >
                              Price
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'center',
                                padding:
                                  '1rem',
                              }}
                            >
                              Stock
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'center',
                                padding:
                                  '1rem',
                              }}
                            >
                              Threshold
                            </th>

                            <th
                              style={{
                                textAlign:
                                  'left',
                                padding:
                                  '1rem',
                              }}
                            >
                              Status
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {products.map(
                            (product) => {

                              const stock =
                                safeNumber(
                                  product?.current_stock
                                )

                              const threshold =
                                safeNumber(
                                  product?.low_stock_threshold
                                )

                              const stockStatus =
                                stock <= 0
                                  ? 'Out of Stock'
                                  : stock <= threshold
                                    ? 'Low Stock'
                                    : 'Available'

                              return (

                                <tr
                                  key={
                                    product?.id
                                  }
                                >

                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    <strong>
                                      {
                                        product?.name ||
                                        'Unnamed Product'
                                      }
                                    </strong>
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    {
                                      product?.product_code ||
                                      '—'
                                    }
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                      textAlign:
                                        'right',
                                    }}
                                  >
                                    {formatCurrency(
                                      product?.price
                                    )}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                      textAlign:
                                        'center',
                                    }}
                                  >
                                    <strong>
                                      {stock}
                                    </strong>
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                      textAlign:
                                        'center',
                                    }}
                                  >
                                    {threshold}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        '1rem',
                                    }}
                                  >
                                    {stockStatus}
                                  </td>

                                </tr>

                              )
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </>

            )}


            {/* =================================================
                CUSTOMERS
            ================================================= */}

            {activeSection ===
              'Customers' && (

              <div className="admin-customers-panel">


                {/* ==========================================
                    SELECTED CUSTOMER
                ========================================== */}

                {selectedCustomer && (

                  <>

                    <div className="admin-shell-section">

                      <button
                        type="button"
                        className="admin-action-button secondary"
                        onClick={() =>
                          setSelectedCustomer(
                            null
                          )
                        }
                      >
                        ← Back to Customers
                      </button>


                      <div
                        style={{
                          marginTop:
                            '1.5rem',
                        }}
                      >

                        <p className="section-label">
                          CUSTOMER PROFILE
                        </p>

                        <h2>
                          {
                            selectedCustomer?.name
                          }
                        </h2>

                        <p>
                          📱{' '}
                          {
                            selectedCustomer?.phone ||
                            '—'
                          }
                        </p>


                        {selectedCustomer?.email && (

                          <p>
                            ✉️{' '}
                            {
                              selectedCustomer.email
                            }
                          </p>

                        )}


                        <p>
                          📍{' '}
                          {
                            selectedCustomer?.location ||
                            'Location not provided'
                          }
                        </p>

                      </div>

                    </div>


                    {/* CUSTOMER SUMMARY */}

                    <div className="admin-shell-section">

                      <p className="section-label">
                        CUSTOMER SUMMARY
                      </p>


                      <div className="admin-dashboard-grid">

                        <div className="stat-card">

                          <span>
                            Total Orders
                          </span>

                          <strong>
                            {safeNumber(
                              selectedCustomer?.total_orders
                            )}
                          </strong>

                        </div>


                        <div className="stat-card highlight">

                          <span>
                            Total Spent
                          </span>

                          <strong>
                            {formatCurrency(
                              selectedCustomer?.total_spent
                            )}
                          </strong>

                        </div>


                        <div className="stat-card">

                          <span>
                            Average Order
                          </span>

                          <strong>
                            {formatCurrency(
                              getCustomerAverage(
                                selectedCustomer
                              )
                            )}
                          </strong>

                        </div>


                        <div className="stat-card">

                          <span>
                            Customer Since
                          </span>

                          <strong>
                            {formatDate(
                              selectedCustomer?.created_at
                            )}
                          </strong>

                        </div>


                        <div className="stat-card">

                          <span>
                            Last Order
                          </span>

                          <strong>
                            {formatDate(
                              selectedCustomer?.last_order_at
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>


                    {/* CUSTOMER INFORMATION */}

                    <div className="admin-shell-section">

                      <p className="section-label">
                        CUSTOMER INFORMATION
                      </p>


                      <div className="admin-placeholder-panel">

                        <p>
                          <strong>
                            Name:
                          </strong>{' '}
                          {
                            selectedCustomer?.name ||
                            '—'
                          }
                        </p>

                        <p>
                          <strong>
                            Phone:
                          </strong>{' '}
                          {
                            selectedCustomer?.phone ||
                            '—'
                          }
                        </p>

                        <p>
                          <strong>
                            Email:
                          </strong>{' '}
                          {
                            selectedCustomer?.email ||
                            'Not provided'
                          }
                        </p>

                        <p>
                          <strong>
                            Location:
                          </strong>{' '}
                          {
                            selectedCustomer?.location ||
                            'Not provided'
                          }
                        </p>

                        <p>
                          <strong>
                            Notes:
                          </strong>{' '}
                          {
                            selectedCustomer?.notes ||
                            'No notes'
                          }
                        </p>

                      </div>

                    </div>


                    {/* CUSTOMER ORDERS */}

                    <div className="admin-shell-section">

                      <p className="section-label">
                        ORDER HISTORY
                      </p>

                      <h2>
                        Customer Orders
                      </h2>

                      <p>
                        {
                          selectedCustomerOrders.length
                        }{' '}
                        order
                        {
                          selectedCustomerOrders.length ===
                          1
                            ? ''
                            : 's'
                        }{' '}
                        found
                      </p>


                      {selectedCustomerOrders.length ===
                      0 ? (

                        <div className="admin-placeholder-panel">

                          <h3>
                            No orders found
                          </h3>

                          <p>
                            This customer does not
                            have any linked orders yet.
                          </p>

                        </div>

                      ) : (

                        <div
                          style={{
                            width:
                              '100%',
                            overflowX:
                              'auto',
                          }}
                        >

                          <table
                            style={{
                              width:
                                '100%',
                              borderCollapse:
                                'collapse',
                              minWidth:
                                '850px',
                            }}
                          >

                            <thead>

                              <tr>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Order
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'center',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Items
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'right',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Total
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Payment
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Status
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Date
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {selectedCustomerOrders.map(
                                (order) => (

                                  <tr
                                    key={
                                      getOrderId(
                                        order
                                      )
                                    }
                                  >

                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      <strong>
                                        #
                                        {String(
                                          order?.order_number ||
                                          getOrderId(
                                            order
                                          )
                                        ).slice(
                                          0,
                                          14
                                        )}
                                      </strong>
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                        textAlign:
                                          'center',
                                      }}
                                    >
                                      {getOrderItemsCount(
                                        order
                                      )}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                        textAlign:
                                          'right',
                                      }}
                                    >
                                      <strong>
                                        {formatCurrency(
                                          getOrderTotal(
                                            order
                                          )
                                        )}
                                      </strong>
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {formatStatus(
                                        getPaymentStatus(
                                          order
                                        )
                                      )}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {formatStatus(
                                        getOrderStatus(
                                          order
                                        )
                                      )}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {formatDateTime(
                                        getAdminOrderDate(
                                          order
                                        )
                                      )}
                                    </td>

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                      )}

                    </div>

                  </>

                )}


                {/* ==========================================
                    CUSTOMER DATABASE
                ========================================== */}

                {!selectedCustomer && (

                  <>

                    <div className="admin-shell-section">

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap:
                            '1rem',
                          marginBottom:
                            '1.5rem',
                          flexWrap:
                            'wrap',
                        }}
                      >

                        <div>

                          <p className="section-label">
                            CUSTOMER DATABASE
                          </p>

                          <h2>
                            Customers
                          </h2>

                          <p>
                            View customers and
                            their purchasing activity.
                          </p>

                        </div>


                        <button
                          type="button"
                          className="admin-action-button secondary"
                          onClick={() =>
                            loadAdminData()
                          }
                          disabled={
                            refreshing
                          }
                        >
                          {refreshing
                            ? 'Refreshing...'
                            : 'Refresh Customers'}
                        </button>

                        <button
                          type="button"
                          className="admin-action-button secondary"
                          onClick={
                            handleExportCustomers
                          }
                          disabled={
                            customers.length === 0
                          }
                        >
                          ⬇ Export CSV
                        </button>

                      </div>


                      <div className="admin-dashboard-grid">

                        <div className="stat-card">

                          <span>
                            Total Customers
                          </span>

                          <strong>
                            {customers.length}
                          </strong>

                        </div>


                        <div className="stat-card">

                          <span>
                            Total Orders
                          </span>

                          <strong>
                            {totalCustomerOrders}
                          </strong>

                        </div>


                        <div className="stat-card highlight">

                          <span>
                            Total Customer Spending
                          </span>

                          <strong>
                            {formatCurrency(
                              totalCustomerSpending
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>


                    <div className="admin-shell-section">

                      <p className="section-label">
                        ALL CUSTOMERS
                      </p>


                      {customers.length ===
                      0 ? (

                        <div className="admin-placeholder-panel">

                          <h3>
                            No customers yet
                          </h3>

                          <p>
                            Customers will appear
                            here when they place orders.
                          </p>

                        </div>

                      ) : (

                        <div
                          style={{
                            width:
                              '100%',
                            overflowX:
                              'auto',
                          }}
                        >

                          <table
                            style={{
                              width:
                                '100%',
                              borderCollapse:
                                'collapse',
                              minWidth:
                                '900px',
                            }}
                          >

                            <thead>

                              <tr>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Customer
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Phone
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Location
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'center',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Orders
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'right',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Total Spent
                                </th>

                                <th
                                  style={{
                                    textAlign:
                                      'left',
                                    padding:
                                      '1rem',
                                  }}
                                >
                                  Last Order
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {customers.map(
                                (customer) => (

                                  <tr
                                    key={
                                      customer?.id
                                    }
                                  >

                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedCustomer(
                                            customer
                                          )
                                        }
                                        style={{
                                          background:
                                            'none',
                                          border:
                                            'none',
                                          padding:
                                            0,
                                          cursor:
                                            'pointer',
                                          font:
                                            'inherit',
                                          fontWeight:
                                            700,
                                        }}
                                      >
                                        {
                                          customer?.name ||
                                          'Unnamed Customer'
                                        }
                                      </button>


                                      {customer?.email && (

                                        <div>
                                          {
                                            customer.email
                                          }
                                        </div>

                                      )}

                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {
                                        customer?.phone ||
                                        '—'
                                      }
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {
                                        customer?.location ||
                                        '—'
                                      }
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                        textAlign:
                                          'center',
                                      }}
                                    >
                                      {safeNumber(
                                        customer?.total_orders
                                      )}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                        textAlign:
                                          'right',
                                      }}
                                    >
                                      <strong>
                                        {formatCurrency(
                                          customer?.total_spent
                                        )}
                                      </strong>
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          '1rem',
                                      }}
                                    >
                                      {formatDate(
                                        customer?.last_order_at
                                      )}
                                    </td>

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                      )}

                    </div>

                  </>

                )}

              </div>

            )}

          </main>

        </div>

      </div>

    </div>
  )
}


export default AdminDashboard