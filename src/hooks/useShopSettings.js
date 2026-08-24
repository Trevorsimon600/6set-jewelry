import { supabase } from "./supabaseClient";

/*
|--------------------------------------------------------------------------
| SETTINGS SERVICE
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Backs AdminSettings.jsx against the `shop_settings` table.
|
| There is only ever one settings row for the shop. fetchShopSettings()
| finds it (if it exists); saveShopSettings() updates it, or creates
| it the first time settings are ever saved.
|
|--------------------------------------------------------------------------
*/

function createServiceError(message, details = null) {
  const error = new Error(message);

  error.name = "SettingsServiceError";
  error.details = details;

  return error;
}


/*
|--------------------------------------------------------------------------
| DEFAULT SHOP SETTINGS
|--------------------------------------------------------------------------
|
| Mirrors the shop_settings table's own column defaults, so the form
| always has every field defined (never undefined) before the real
| row loads.
|
|--------------------------------------------------------------------------
*/

export const defaultShopSettings = {
  shop_name: "6SET JEWELRY",
  shop_description: "",
  logo_url: "",
  phone: "",
  whatsapp_number: "",
  email: "",
  location: "",
  payment_method: "Pochi la Biashara",
  payment_number: "",
  payment_recipient: "",
  payment_instructions: "",
  delivery_instructions: "",
  delivery_fee_policy: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  announcement: "",
  store_status: "open",
  closed_message:
    "We're currently closed. Please check back soon.",
};


/*
|--------------------------------------------------------------------------
| ALLOWED FIELDS
|--------------------------------------------------------------------------
|
| Anything outside this list (id, created_at, updated_at, or a stray
| field from the form) is dropped before writing to Supabase.
|
|--------------------------------------------------------------------------
*/

const SETTINGS_FIELDS = Object.keys(defaultShopSettings);

function sanitizeSettingsPayload(settings) {
  const payload = {};

  SETTINGS_FIELDS.forEach((field) => {
    if (settings?.[field] !== undefined) {
      payload[field] = settings[field] ?? "";
    }
  });

  return payload;
}


/*
|--------------------------------------------------------------------------
| FETCH SHOP SETTINGS
|--------------------------------------------------------------------------
*/

export async function fetchShopSettings() {
  try {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("fetchShopSettings() failed:", error);

      throw createServiceError(
        "Unable to load shop settings.",
        error
      );
    }

    return data || null;
  } catch (error) {
    console.error("fetchShopSettings() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| SAVE SHOP SETTINGS
|--------------------------------------------------------------------------
|
| Updates the existing settings row, or creates it the first time.
|
|--------------------------------------------------------------------------
*/

export async function saveShopSettings(settings) {
  try {
    const payload = sanitizeSettingsPayload(settings);

    const { data: existingRow, error: fetchError } =
      await supabase
        .from("shop_settings")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "saveShopSettings() lookup failed:",
        fetchError
      );

      throw createServiceError(
        "Unable to save shop settings.",
        fetchError
      );
    }

    if (existingRow?.id) {
      const { data, error } = await supabase
        .from("shop_settings")
        .update(payload)
        .eq("id", existingRow.id)
        .select()
        .single();

      if (error) {
        console.error("saveShopSettings() update failed:", error);

        throw createServiceError(
          "Unable to save shop settings.",
          error
        );
      }

      return data;
    }

    const { data, error } = await supabase
      .from("shop_settings")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("saveShopSettings() insert failed:", error);

      throw createServiceError(
        "Unable to save shop settings.",
        error
      );
    }

    return data;
  } catch (error) {
    console.error("saveShopSettings() failed:", error);

    throw error;
  }
}


const settingsService = {
  defaultShopSettings,
  fetchShopSettings,
  saveShopSettings,
};

export default settingsService;