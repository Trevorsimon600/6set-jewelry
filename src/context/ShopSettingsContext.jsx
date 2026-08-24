import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  defaultShopSettings,
  fetchShopSettings,
} from '../lib/settingsService'

// =================================
// CONTEXT
// =================================

const ShopSettingsContext =
  createContext(null)

// =================================
// PROVIDER
// =================================

export function ShopSettingsProvider({
  children,
}) {
  const [settings, setSettings] =
    useState(defaultShopSettings)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // =================================
  // LOAD SETTINGS
  // =================================

  useEffect(() => {
    let isCurrent = true

    async function loadSettings() {
      try {
        setLoading(true)
        setError('')

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
        console.error(
          'Failed to load shop settings:',
          loadError
        )

        if (!isCurrent) {
          return
        }

        setError(
          loadError.message ||
            'Unable to load shop settings.'
        )

        // Keep default settings so
        // storefront can still render.
        setSettings(
          defaultShopSettings
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
  // SAFE LOGO
  // =================================

  const logoUrl =
    settings.logo_url?.trim() ||
    '/logo.jpg'

  // =================================
  // SAFE SHOP NAME
  // =================================

  const shopName =
    settings.shop_name?.trim() ||
    '6SET JEWELRY'

  // =================================
  // SAFE SHOP DESCRIPTION
  // =================================

  const shopDescription =
    settings.shop_description?.trim() ||
    ''

  // =================================
  // SAFE ANNOUNCEMENT
  // =================================

  const announcement =
    settings.announcement?.trim() ||
    ''

  const storeStatus =
    settings.store_status?.trim() || 'open'

  const closedMessage =
    settings.closed_message?.trim() ||
    "We're currently closed. Please check back soon."  

  // =================================
  // SAFE WHATSAPP NUMBER
  // =================================

  const whatsappNumber =
    settings.whatsapp_number?.trim() ||
    ''

  // =================================
  // NORMALIZE KENYAN NUMBER
  // =================================

  function normalizeKenyanNumber(
    number
  ) {
    if (!number) {
      return ''
    }

    const cleaned = String(number)
      .replace(/\D/g, '')

    if (cleaned.startsWith('254')) {
      return cleaned
    }

    if (cleaned.startsWith('0')) {
      return `254${cleaned.slice(1)}`
    }

    return cleaned
  }

  const normalizedWhatsappNumber =
    normalizeKenyanNumber(
      whatsappNumber
    )

  // =================================
  // WHATSAPP URL
  // =================================

  const whatsappMessage =
    `Hello ${shopName}, I would like to make an inquiry.`

  const whatsappUrl =
    normalizedWhatsappNumber
      ? `https://wa.me/${normalizedWhatsappNumber}?text=${encodeURIComponent(
          whatsappMessage
        )}`
      : ''

  // =================================
  // PHONE
  // =================================

  const phoneNumber =
    settings.phone?.trim() ||
    ''

  const phoneUrl =
    phoneNumber
      ? `tel:${phoneNumber}`
      : ''

  // =================================
  // EMAIL
  // =================================

  const email =
    settings.email?.trim() ||
    ''

  // =================================
  // LOCATION
  // =================================

  const location =
    settings.location?.trim() ||
    ''

  // =================================
  // PAYMENT METHOD
  // =================================

  const paymentMethod =
    settings.payment_method?.trim() ||
    ''

  // =================================
  // PAYMENT NUMBER
  // =================================

  const paymentNumber =
    settings.payment_number?.trim() ||
    ''

  // =================================
  // PAYMENT RECIPIENT
  // =================================

  const paymentRecipient =
    settings.payment_recipient?.trim() ||
    ''

  // =================================
  // PAYMENT INSTRUCTIONS
  // =================================

  const paymentInstructions =
    settings.payment_instructions?.trim() ||
    ''

  // =================================
  // DELIVERY
  // =================================

  const deliveryInstructions =
    settings.delivery_instructions?.trim() ||
    ''

  const deliveryFeePolicy =
    settings.delivery_fee_policy?.trim() ||
    ''

  // =================================
  // SOCIAL MEDIA
  // =================================

  const instagramUrl =
    settings.instagram_url?.trim() ||
    ''

  const facebookUrl =
    settings.facebook_url?.trim() ||
    ''

  const tiktokUrl =
    settings.tiktok_url?.trim() ||
    ''

  // =================================
  // CONTEXT VALUE
  // =================================

  const value = {
    // Raw settings
    settings,

    // State
    loading,
    error,

    // Shop
    shopName,
    shopDescription,
    logoUrl,
    storeStatus,
    closedMessage,

    // Contact
    phoneNumber,
    phoneUrl,

    whatsappNumber,
    normalizedWhatsappNumber,
    whatsappUrl,

    email,
    location,

    // Payment
    paymentMethod,
    paymentNumber,
    paymentRecipient,
    paymentInstructions,

    // Delivery
    deliveryInstructions,
    deliveryFeePolicy,

    // Announcement
    announcement,

    // Social media
    instagramUrl,
    facebookUrl,
    tiktokUrl,
  }

  return (
    <ShopSettingsContext.Provider
      value={value}
    >
      {children}
    </ShopSettingsContext.Provider>
  )
}

// =================================
// HOOK
// =================================

export function useShopSettings() {
  const context =
    useContext(
      ShopSettingsContext
    )

  if (!context) {
    throw new Error(
      'useShopSettings must be used inside a ShopSettingsProvider.'
    )
  }

  return context
}

export default ShopSettingsContext