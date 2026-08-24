import { supabase } from "./supabaseClient";

/*
|--------------------------------------------------------------------------
| CATEGORY SERVICE
|--------------------------------------------------------------------------
| 6SET JEWELRY
|
| Backs AdminCategories.jsx against the `categories` table.
|
|--------------------------------------------------------------------------
*/

function createServiceError(message, details = null) {
  const error = new Error(message);

  error.name = "CategoryServiceError";
  error.details = details;

  return error;
}


/*
|--------------------------------------------------------------------------
| SLUGIFY
|--------------------------------------------------------------------------
*/

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


/*
|--------------------------------------------------------------------------
| FETCH CATEGORIES
|--------------------------------------------------------------------------
|
| Used by adminService.js's fetchAdminData(), and available for
| any page that wants the full category list directly.
|
|--------------------------------------------------------------------------
*/

export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("fetchCategories() failed:", error);

      throw createServiceError(
        "Unable to fetch categories.",
        error
      );
    }

    return data || [];
  } catch (error) {
    console.error("fetchCategories() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
|
| Accepts the draft category shape from AdminCategories.jsx:
|
|   { name, slug, description, published, image }
|
|--------------------------------------------------------------------------
*/

export async function createCategory(categoryData) {
  try {
    const name = String(categoryData?.name || "").trim();

    if (!name) {
      throw createServiceError("Category name is required.");
    }

    const slug =
      slugify(categoryData?.slug) ||
      slugify(name);

    if (!slug) {
      throw createServiceError(
        "Could not generate a category slug."
      );
    }

    const payload = {
      name,
      slug,

      description:
        categoryData?.description
          ? String(categoryData.description).trim()
          : null,

      published:
        categoryData?.published === undefined
          ? true
          : Boolean(categoryData.published),

      sort_order: Number.isFinite(
        Number(categoryData?.sort_order)
      )
        ? Number(categoryData.sort_order)
        : 0,

      image: categoryData?.image || null,
    };

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("createCategory() failed:", error);

      if (error.code === "23505") {
        throw createServiceError(
          "A category with that name or slug already exists."
        );
      }

      throw createServiceError(
        "Unable to create category.",
        error
      );
    }

    return data;
  } catch (error) {
    console.error("createCategory() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
*/

export async function updateCategory(categoryId, categoryData) {
  try {
    const normalizedId = String(categoryId || "").trim();

    if (!normalizedId) {
      throw createServiceError("Category ID is required.");
    }

    const payload = {};

    if (categoryData?.name !== undefined) {
      const name = String(categoryData.name).trim();

      if (!name) {
        throw createServiceError(
          "Category name is required."
        );
      }

      payload.name = name;
    }

    if (categoryData?.slug !== undefined) {
      const slug =
        slugify(categoryData.slug) ||
        (payload.name ? slugify(payload.name) : undefined);

      if (slug) {
        payload.slug = slug;
      }
    }

    if (categoryData?.description !== undefined) {
      payload.description = categoryData.description
        ? String(categoryData.description).trim()
        : null;
    }

    if (categoryData?.published !== undefined) {
      payload.published = Boolean(categoryData.published);
    }

    if (categoryData?.sort_order !== undefined) {
      payload.sort_order = Number(categoryData.sort_order) || 0;
    }

    if (categoryData?.image !== undefined) {
      payload.image = categoryData.image || null;
    }

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", normalizedId)
      .select()
      .single();

    if (error) {
      console.error("updateCategory() failed:", error);

      if (error.code === "23505") {
        throw createServiceError(
          "A category with that name or slug already exists."
        );
      }

      throw createServiceError(
        "Unable to update category.",
        error
      );
    }

    return data;
  } catch (error) {
    console.error("updateCategory() failed:", error);

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
|
| products.category_id -> categories.id is ON DELETE RESTRICT, so any
| product still pointing at this category will block the delete.
|
| If reassignToCategoryId is provided, products are moved there first.
| Otherwise, if products remain, the delete is blocked with a clear
| error message instead of a raw Postgres error.
|
|--------------------------------------------------------------------------
*/

export async function deleteCategory(
  categoryId,
  { reassignToCategoryId } = {}
) {
  try {
    const normalizedId = String(categoryId || "").trim();

    if (!normalizedId) {
      throw createServiceError("Category ID is required.");
    }

    /*
    |------------------------------------------------------------------
    | REASSIGN PRODUCTS FIRST (IF REQUESTED)
    |------------------------------------------------------------------
    */

    if (reassignToCategoryId) {
      const normalizedTargetId = String(
        reassignToCategoryId
      ).trim();

      const { error: reassignError } = await supabase
        .from("products")
        .update({ category_id: normalizedTargetId })
        .eq("category_id", normalizedId);

      if (reassignError) {
        console.error(
          "Category product reassignment failed:",
          reassignError
        );

        throw createServiceError(
          "Unable to move products to the new category.",
          reassignError
        );
      }
    }

    /*
    |------------------------------------------------------------------
    | DELETE CATEGORY
    |------------------------------------------------------------------
    */

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", normalizedId);

    if (deleteError) {
      console.error("deleteCategory() failed:", deleteError);

      if (deleteError.code === "23503") {
        throw createServiceError(
          "This category still has products assigned to it. Reassign them first."
        );
      }

      throw createServiceError(
        "Unable to delete category.",
        deleteError
      );
    }

    return { success: true };
  } catch (error) {
    console.error("deleteCategory() failed:", error);

    throw error;
  }
}


const categoryService = {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;