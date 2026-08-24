import { supabase } from "./supabaseClient";

/*
|--------------------------------------------------------------------------
| IMAGE UPLOAD UTIL
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Shared image handling for the admin dashboard:
|
|   - local preview URLs (no network call)
|   - client-side validation (type / size)
|   - Supabase Storage uploads for categories and products
|
|--------------------------------------------------------------------------
*/

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const CATEGORY_IMAGE_BUCKET = "category-images";
const PRODUCT_IMAGE_BUCKET = "product-images";


/*
|--------------------------------------------------------------------------
| CREATE / REVOKE LOCAL PREVIEW
|--------------------------------------------------------------------------
|
| Pure client-side. Used to show a preview of the selected file
| before it is uploaded anywhere.
|
|--------------------------------------------------------------------------
*/

export function createImagePreview(file) {
  if (!file) {
    return "";
  }

  return URL.createObjectURL(file);
}

export function revokeImagePreview(url) {
  if (!url) {
    return;
  }

  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    // Non-blob URLs (already-uploaded Supabase URLs) can't be revoked.
    // That's fine — nothing to clean up in that case.
  }
}


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

export function isValidImageType(file) {
  if (!file) {
    return false;
  }

  return ALLOWED_IMAGE_TYPES.includes(
    String(file.type || "").toLowerCase()
  );
}

export function isValidImageSize(file) {
  if (!file) {
    return false;
  }

  return file.size > 0 && file.size <= MAX_IMAGE_SIZE_BYTES;
}


/*
|--------------------------------------------------------------------------
| BUILD SAFE FILE PATH
|--------------------------------------------------------------------------
*/

function buildStoragePath(folderId, file) {
  const extension =
    (file.name || "").split(".").pop()?.toLowerCase() ||
    "jpg";

  const safeExtension = /^[a-z0-9]+$/.test(extension)
    ? extension
    : "jpg";

  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExtension}`;

  return `${folderId}/${uniqueName}`;
}


/*
|--------------------------------------------------------------------------
| UPLOAD CATEGORY IMAGE
|--------------------------------------------------------------------------
|
| Uploads to the "category-images" storage bucket and returns the
| public URL (a plain string).
|
|--------------------------------------------------------------------------
*/

export async function uploadCategoryImageToSupabase(
  file,
  categoryId
) {
  if (!file) {
    throw new Error("No image file was provided.");
  }

  const folderId = categoryId
    ? String(categoryId)
    : `new-${Date.now()}`;

  const path = buildStoragePath(folderId, file);

  const { error: uploadError } = await supabase.storage
    .from(CATEGORY_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "uploadCategoryImageToSupabase() failed:",
      uploadError
    );

    throw new Error(
      "Unable to upload category image."
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(CATEGORY_IMAGE_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}


/*
|--------------------------------------------------------------------------
| UPLOAD PRODUCT IMAGE
|--------------------------------------------------------------------------
|
| Used internally by productService.js. Uploads to the
| "product-images" bucket and returns { publicUrl, storagePath }
| so the caller can also record a row in product_images.
|
|--------------------------------------------------------------------------
*/

export async function uploadProductImageToSupabase(
  file,
  productId
) {
  if (!file) {
    throw new Error("No image file was provided.");
  }

  const folderId = productId
    ? String(productId)
    : `new-${Date.now()}`;

  const path = buildStoragePath(folderId, file);

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "uploadProductImageToSupabase() failed:",
      uploadError
    );

    throw new Error(
      "Unable to upload product image."
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return {
    publicUrl,
    storagePath: path,
  };
}


const imageUploadUtil = {
  createImagePreview,
  revokeImagePreview,
  isValidImageType,
  isValidImageSize,
  uploadCategoryImageToSupabase,
  uploadProductImageToSupabase,
};

export default imageUploadUtil;