import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient'

// =================================
// SUPABASE REQUIREMENT
// =================================

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    )
  }

  return supabase
}

// =================================
// DEFAULT SETTINGS
// =================================

export const defaultShopSettings = {
  id: null,

  shop_name: '6SET JEWELRY',
  shop_description: '',
  logo_url: '',

  phone: '',
  whatsapp_number: '',
  email: '',
  location: '',

  payment_method: 'Pochi la Biashara',
  payment_number: '',
  payment_recipient: '',
  payment_instructions: '',

  delivery_instructions: '',
  delivery_fee_policy: '',

  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',

  announcement: '',

  // =================================
  // STORE STATUS
  // =================================

  store_status: 'open',
  closed_message:
    "We're currently closed. Please check back soon.",
}

// =================================
// FETCH SETTINGS
// =================================

export async function fetchShopSettings() {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('shop_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load shop settings.'
    )
  }

  if (!data) {
    return defaultShopSettings
  }

  return {
    ...defaultShopSettings,
    ...data,
  }
}

// =================================
// SAVE SETTINGS
// =================================

export async function saveShopSettings(
  settings
) {
  const client = requireSupabase()

  const payload = {
    shop_name:
      settings.shop_name?.trim() ||
      '6SET JEWELRY',

    shop_description:
      settings.shop_description?.trim() ||
      '',

    logo_url:
      settings.logo_url?.trim() ||
      '',

    phone:
      settings.phone?.trim() ||
      '',

    whatsapp_number:
      settings.whatsapp_number?.trim() ||
      '',

    email:
      settings.email?.trim() ||
      '',

    location:
      settings.location?.trim() ||
      '',

    payment_method:
      settings.payment_method?.trim() ||
      'Pochi la Biashara',

    payment_number:
      settings.payment_number?.trim() ||
      '',

    payment_recipient:
      settings.payment_recipient?.trim() ||
      '',

    payment_instructions:
      settings.payment_instructions?.trim() ||
      '',

    delivery_instructions:
      settings.delivery_instructions?.trim() ||
      '',

    delivery_fee_policy:
      settings.delivery_fee_policy?.trim() ||
      '',

    instagram_url:
      settings.instagram_url?.trim() ||
      '',

    facebook_url:
      settings.facebook_url?.trim() ||
      '',

    tiktok_url:
      settings.tiktok_url?.trim() ||
      '',

    announcement:
      settings.announcement?.trim() ||
      '',

    // =================================
    // STORE STATUS
    // =================================

    store_status:
      settings.store_status === 'closed'
        ? 'closed'
        : 'open',

    closed_message:
      settings.closed_message?.trim() ||
      "We're currently closed. Please check back soon.",

    // =================================
    // UPDATED TIME
    // =================================

    updated_at:
      new Date().toISOString(),
  }

  // =================================
  // CHECK FOR EXISTING SETTINGS ROW
  // =================================

  const {
    data: existing,
    error: existingError,
  } = await client
    .from('shop_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (existingError) {
    throw new Error(
      existingError.message ||
        'Failed to check shop settings.'
    )
  }

  // =================================
  // UPDATE EXISTING ROW
  // =================================

  if (existing?.id) {
    const {
      data,
      error,
    } = await client
      .from('shop_settings')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw new Error(
        error.message ||
          'Failed to save shop settings.'
      )
    }

    return data
  }

  // =================================
  // CREATE SETTINGS ROW
  // =================================

  const {
    data,
    error,
  } = await client
    .from('shop_settings')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to create shop settings.'
    )
  }

  return data
}