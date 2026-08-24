import { useEffect, useState } from 'react'

import {
  defaultShopSettings,
  fetchShopSettings,
  saveShopSettings,
} from '../lib/settingsService'

function AdminSettings() {
  const [settings, setSettings] = useState(
    defaultShopSettings
  )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  // =================================
  // LOAD SETTINGS
  // =================================

  useEffect(() => {
    let isCurrent = true

    async function loadSettings() {
      setLoading(true)
      setError('')

      try {
        const loadedSettings =
          await fetchShopSettings()

        if (!isCurrent) {
          return
        }

        setSettings({
          ...defaultShopSettings,
          ...loadedSettings,
        })
      } catch (loadError) {
        if (!isCurrent) {
          return
        }

        setError(
          loadError.message ||
            'Unable to load shop settings.'
        )
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isCurrent = false
    }
  }, [])

  // =================================
  // HANDLE INPUT
  // =================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target

    setSettings((current) => ({
      ...current,
      [name]: value,
    }))

    setSuccess('')
  }

  // =================================
  // SAVE SETTINGS
  // =================================

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const savedSettings =
        await saveShopSettings(
          settings
        )

      setSettings({
        ...defaultShopSettings,
        ...savedSettings,
      })

      setSuccess(
        'Shop settings saved successfully.'
      )
    } catch (saveError) {
      setError(
        saveError.message ||
          'Unable to save shop settings.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =================================
  // LOADING
  // =================================

  if (loading) {
    return (
      <div className="admin-settings-panel">
        <p>Loading shop settings...</p>
      </div>
    )
  }

  // =================================
  // SETTINGS FORM
  // =================================

  return (
    <div className="admin-settings-panel">

      <div className="admin-settings-header">
        <div>
          <p className="section-label">
            SHOP SETTINGS
          </p>

          <h2>
            Manage Your Shop
          </h2>

          <p>
            Update the information customers
            will see throughout the store.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-settings-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-settings-message success">
          {success}
        </div>
      )}

      <form
        className="admin-settings-form"
        onSubmit={handleSubmit}
      >

        {/* ================================
            SHOP INFORMATION
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">
            <h3>
              Shop Information
            </h3>

            <p>
              Basic information about the shop.
            </p>
          </div>

          <div className="admin-settings-grid">

            <label>
              <span>Shop Name</span>

              <input
                type="text"
                name="shop_name"
                value={
                  settings.shop_name
                }
                onChange={handleChange}
                placeholder="6SET JEWELRY"
              />
            </label>

            <label>
              <span>Logo URL</span>

              <input
                type="url"
                name="logo_url"
                value={
                  settings.logo_url
                }
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label className="full-width">
              <span>
                Shop Description
              </span>

              <textarea
                name="shop_description"
                value={
                  settings.shop_description
                }
                onChange={handleChange}
                rows="4"
                placeholder="Tell customers about your shop..."
              />
            </label>

          </div>

        </section>

        {/* ================================
            CONTACT
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">
            <h3>
              Contact Information
            </h3>

            <p>
              How customers can contact the shop.
            </p>
          </div>

          <div className="admin-settings-grid">

            <label>
              <span>
                Phone Number
              </span>

              <input
                type="tel"
                name="phone"
                value={
                  settings.phone
                }
                onChange={handleChange}
                placeholder="07XXXXXXXX"
              />
            </label>

            <label>
              <span>
                WhatsApp Number
              </span>

              <input
                type="tel"
                name="whatsapp_number"
                value={
                  settings.whatsapp_number
                }
                onChange={handleChange}
                placeholder="07XXXXXXXX"
              />
            </label>

            <label>
              <span>Email</span>

              <input
                type="email"
                name="email"
                value={
                  settings.email
                }
                onChange={handleChange}
                placeholder="shop@example.com"
              />
            </label>

            <label>
              <span>Location</span>

              <input
                type="text"
                name="location"
                value={
                  settings.location
                }
                onChange={handleChange}
                placeholder="Shop location"
              />
            </label>

          </div>

        </section>

        {/* ================================
            PAYMENT
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">
            <h3>
              Payment Information
            </h3>

            <p>
              Payment information shown to customers.
            </p>
          </div>

          <div className="admin-settings-grid">

            <label>
              <span>
                Payment Method
              </span>

              <input
                type="text"
                name="payment_method"
                value={
                  settings.payment_method
                }
                onChange={handleChange}
                placeholder="Pochi la Biashara"
              />
            </label>

            <label>
              <span>
                Payment Number
              </span>

              <input
                type="tel"
                name="payment_number"
                value={
                  settings.payment_number
                }
                onChange={handleChange}
                placeholder="07XXXXXXXX"
              />
            </label>

            <label>
              <span>
                Recipient / Business Name
              </span>

              <input
                type="text"
                name="payment_recipient"
                value={
                  settings.payment_recipient
                }
                onChange={handleChange}
                placeholder="Recipient name"
              />
            </label>

            <label className="full-width">
              <span>
                Payment Instructions
              </span>

              <textarea
                name="payment_instructions"
                value={
                  settings.payment_instructions
                }
                onChange={handleChange}
                rows="5"
                placeholder="Explain how customers should pay..."
              />
            </label>

          </div>

        </section>

        {/* ================================
            DELIVERY
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">
            <h3>
              Delivery Information
            </h3>

            <p>
              Explain how delivery works.
            </p>
          </div>

          <div className="admin-settings-grid">

            <label className="full-width">
              <span>
                Delivery Instructions
              </span>

              <textarea
                name="delivery_instructions"
                value={
                  settings.delivery_instructions
                }
                onChange={handleChange}
                rows="4"
                placeholder="Explain your delivery process..."
              />
            </label>

            <label className="full-width">
              <span>
                Delivery Fee Policy
              </span>

              <textarea
                name="delivery_fee_policy"
                value={
                  settings.delivery_fee_policy
                }
                onChange={handleChange}
                rows="4"
                placeholder="Explain how delivery charges are calculated..."
              />
            </label>

          </div>

        </section>

        {/* ================================
            SOCIAL MEDIA
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">
            <h3>
              Social Media
            </h3>

            <p>
              Add links to your social platforms.
            </p>
          </div>

          <div className="admin-settings-grid">

            <label>
              <span>
                Instagram
              </span>

              <input
                type="url"
                name="instagram_url"
                value={
                  settings.instagram_url
                }
                onChange={handleChange}
                placeholder="https://instagram.com/..."
              />
            </label>

            <label>
              <span>
                Facebook
              </span>

              <input
                type="url"
                name="facebook_url"
                value={
                  settings.facebook_url
                }
                onChange={handleChange}
                placeholder="https://facebook.com/..."
              />
            </label>

            <label>
              <span>
                TikTok
              </span>

              <input
                type="url"
                name="tiktok_url"
                value={
                  settings.tiktok_url
                }
                onChange={handleChange}
                placeholder="https://tiktok.com/@..."
              />
            </label>

            <label className="full-width">
              <span>
                Shop Announcement
              </span>

              <textarea
                name="announcement"
                value={
                  settings.announcement
                }
                onChange={handleChange}
                rows="3"
                placeholder="Optional announcement for customers..."
              />
            </label>

          </div>

        </section>
      
        {/* ================================
            STORE STATUS
        ================================= */}

        <section className="admin-settings-section">

          <div className="admin-settings-section-header">

            <h3>
              Store Status
            </h3>

            <p>
              Control whether customers can currently
              shop from the storefront.
            </p>

          </div>


          <div className="admin-settings-grid">

            {/* =================================
                STATUS
            ================================= */}

            <label>
              <span>
                Store Status
              </span>

              <select
                name="store_status"
                value={
                  settings.store_status || 'open'
                }
                onChange={handleChange}
              >

                <option value="open">
                  🟢 Open
                </option>

                <option value="closed">
                  🔴 Closed
                </option>

              </select>

            </label>


            {/* =================================
                CLOSED MESSAGE
            ================================= */}

            <label className="full-width">

              <span>
                Closed Store Message
              </span>

              <textarea
                name="closed_message"
                value={
                  settings.closed_message || ''
                }
                onChange={handleChange}
                rows="3"
                placeholder="We're currently closed. Please check back soon."
              />

            </label>

          </div>

        </section>

        {/* ================================
            SAVE
        ================================= */}

        <div className="admin-settings-actions">

          <button
            type="submit"
            className="admin-action-button"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Shop Settings'}
          </button>

        </div>

      </form>

    </div>
  )
}

export default AdminSettings