import { useEffect, useState } from 'react'

import {
  fetchCustomers,
} from '../lib/orderService'

import { exportToCSV } from '../lib/csvExport'

// ============================================================
// ADMIN CUSTOMERS
// ============================================================

function AdminCustomers() {

  // ----------------------------------------------------------
  // CUSTOMER DATA
  // ----------------------------------------------------------

  const [customers, setCustomers] =
    useState([])

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const [search, setSearch] =
    useState('')

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  const [loading, setLoading] =
    useState(true)

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  const [error, setError] =
    useState('')

  // ==========================================================
  // LOAD CUSTOMERS
  // ==========================================================

  async function loadCustomers() {

    setLoading(true)
    setError('')

    try {

      const data =
        await fetchCustomers()

      setCustomers(data || [])

    } catch (err) {

      console.error(
        'Failed to load customers:',
        err
      )

      setError(
        err.message ||
          'Unable to load customers.'
      )

    } finally {

      setLoading(false)

    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadCustomers()

  }, [])

  // ==========================================================
  // SEARCH FILTER
  // ==========================================================

  const filteredCustomers =
    customers.filter((customer) => {

      const searchValue =
        search
          .trim()
          .toLowerCase()

      if (!searchValue) {
        return true
      }

      const name =
        String(
          customer.name || ''
        ).toLowerCase()

      const phone =
        String(
          customer.phone || ''
        ).toLowerCase()

      const location =
        String(
          customer.location || ''
        ).toLowerCase()

      return (
        name.includes(searchValue) ||
        phone.includes(searchValue) ||
        location.includes(searchValue)
      )
    })

  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  function formatCurrency(amount) {

    return `KES ${Number(
      amount || 0
    ).toLocaleString(
      'en-KE',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`
  }

  // ==========================================================
  // EXPORT CUSTOMERS TO CSV
  //
  // Exports whatever is currently visible in the table
  // (respects the active search).
  // ==========================================================

  function handleExportCustomers() {
    const rows = filteredCustomers.map((customer) => ({
      name: customer.name || '',
      phone: customer.phone || '',
      location: customer.location || '',
      total_orders: customer.total_orders || 0,
      total_spent: customer.total_spent || 0,
    }))

    exportToCSV(rows, 'customers.csv')
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {

    return (
      <div className="admin-loading-state">

        <p>
          Loading customers...
        </p>

      </div>
    )
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error) {

    return (
      <div className="admin-placeholder-panel">

        <h3>
          Unable to Load Customers
        </h3>

        <p>
          {error}
        </p>

        <button
          type="button"
          className="admin-action-button"
          onClick={loadCustomers}
        >
          Try Again
        </button>

      </div>
    )
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="admin-customers-panel">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="admin-shell-section">

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
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
              {customers.length}{' '}
              customer
              {customers.length === 1
                ? ''
                : 's'}
            </p>

          </div>

          <button
            type="button"
            className="admin-action-button"
            onClick={loadCustomers}
          >
            Refresh
          </button>

          <button
            type="button"
            className="admin-action-button secondary"
            onClick={handleExportCustomers}
            disabled={
              filteredCustomers.length === 0
            }
          >
            ⬇ Export CSV
          </button>

        </div>

      </div>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <div className="admin-shell-section">

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search by name, phone or location..."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            fontSize: '15px',
            boxSizing: 'border-box',
          }}
        />

      </div>

      {/* ====================================================
          CUSTOMER TABLE
      ==================================================== */}

      <div className="admin-shell-section">

        {filteredCustomers.length === 0 ? (

          <div className="admin-placeholder-panel">

            <h3>
              No Customers Found
            </h3>

            <p>
              {search
                ? 'No customers match your search.'
                : 'There are currently no customers.'}
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
                minWidth: '700px',
              }}
            >

              <thead>

                <tr>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom:
                        '1px solid #ddd',
                    }}
                  >
                    Customer
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom:
                        '1px solid #ddd',
                    }}
                  >
                    Phone
                  </th>

                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom:
                        '1px solid #ddd',
                    }}
                  >
                    Location
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom:
                        '1px solid #ddd',
                    }}
                  >
                    Orders
                  </th>

                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px',
                      borderBottom:
                        '1px solid #ddd',
                    }}
                  >
                    Total Spent
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCustomers.map(
                  (customer) => (

                    <tr
                      key={customer.id}
                    >

                      <td
                        style={{
                          padding: '14px 12px',
                          borderBottom:
                            '1px solid #eee',
                          fontWeight: '600',
                        }}
                      >
                        {customer.name}
                      </td>

                      <td
                        style={{
                          padding: '14px 12px',
                          borderBottom:
                            '1px solid #eee',
                        }}
                      >
                        {customer.phone}
                      </td>

                      <td
                        style={{
                          padding: '14px 12px',
                          borderBottom:
                            '1px solid #eee',
                        }}
                      >
                        {customer.location ||
                          '—'}
                      </td>

                      <td
                        style={{
                          padding: '14px 12px',
                          borderBottom:
                            '1px solid #eee',
                          textAlign: 'right',
                        }}
                      >
                        {customer.total_orders ||
                          0}
                      </td>

                      <td
                        style={{
                          padding: '14px 12px',
                          borderBottom:
                            '1px solid #eee',
                          textAlign: 'right',
                          fontWeight: '600',
                        }}
                      >
                        {formatCurrency(
                          customer.total_spent
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

    </div>
  )
}

export default AdminCustomers