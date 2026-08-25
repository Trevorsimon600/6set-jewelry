import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient'

// ============================================================
// SUPABASE REQUIREMENT
// ============================================================

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    )
  }

  return supabase
}

// ============================================================
// HELPERS
// ============================================================

function getCategoryFromRow(row) {
  const category = Array.isArray(row?.categories)
    ? row.categories[0]
    : row?.categories

  return category || null
}

function calculateAvailability(
  currentStock,
  lowStockThreshold
) {
  if (currentStock <= 0) {
    return 'Out of Stock'
  }

  if (currentStock <= lowStockThreshold) {
    return 'Low Stock'
  }

  return 'Available'
}

function calculateEffectiveMaxQuantity(
  currentStock,
  maximumOrderQuantity
) {
  const safeStock = Math.max(
    Number(currentStock ?? 0),
    0
  )

  const configuredMaximum = Math.max(
    Number(maximumOrderQuantity ?? 1),
    1
  )

  return Math.min(
    safeStock,
    configuredMaximum
  )
}

// ============================================================
// PRODUCT MAPPER
// ============================================================

function mapProduct(row) {
  const category = getCategoryFromRow(row)

  const currentStock = Number(
    row?.current_stock ?? 0
  )

  const lowStockThreshold = Number(
    row?.low_stock_threshold ?? 5
  )

  const minimumOrderQuantity = Math.max(
    Number(
      row?.minimum_order_quantity ?? 1
    ),
    1
  )

  const maximumOrderQuantity = Math.max(
    Number(
      row?.maximum_order_quantity ?? 10
    ),
    1
  )

  const effectiveMaxQuantity =
    calculateEffectiveMaxQuantity(
      currentStock,
      maximumOrderQuantity
    )

  const effectiveMinQuantity =
    currentStock >= minimumOrderQuantity
      ? minimumOrderQuantity
      : 0

  return {
    id: row?.id,

    name: row?.name || '',

    category:
      category?.name ||
      row?.category ||
      '',

    categoryId:
      row?.category_id ||
      category?.id ||
      null,

    categorySlug:
      category?.slug ||
      row?.category_slug ||
      '',

    price: Number(
      row?.price ?? 0
    ),

    image:
      row?.main_image_url ||
      row?.image ||
      '',

    description:
      row?.description ||
      '',

    minQuantity:
      minimumOrderQuantity,

    maxQuantity:
      maximumOrderQuantity,

    currentStock,

    lowStockThreshold,

    effectiveMinQuantity,

    effectiveMaxQuantity,

    availability:
      calculateAvailability(
        currentStock,
        lowStockThreshold
      ),

    isInStock:
      currentStock > 0,

    isOrderable:
      currentStock >= minimumOrderQuantity &&
      effectiveMaxQuantity >=
        minimumOrderQuantity,

    published:
      row?.published ?? true,

    created_at:
      row?.created_at ||
      row?.createdAt ||
      null,

    updated_at:
      row?.updated_at ||
      row?.updatedAt ||
      null,

    // Preserve any other database fields
    ...row,
  }
}

// ============================================================
// MAP CATEGORY
// ============================================================

function mapCategory(category) {
  return {
    id: category?.id,

    name:
      category?.name || '',

    slug:
      category?.slug || '',

    description:
      category?.description || '',

    image:
      category?.image ||
      category?.image_url ||
      '',

    published:
      category?.published ?? true,

    created_at:
      category?.created_at ||
      null,

    updated_at:
      category?.updated_at ||
      null,

    ...category,
  }
}

// ============================================================
// STOREFRONT PRODUCTS
// ============================================================

export async function fetchStorefrontProducts() {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('published', true)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load products.'
    )
  }

  return (data || []).map(
    mapProduct
  )
}

// ============================================================
// ADMIN PRODUCTS
// ============================================================

export async function fetchProducts() {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load products.'
    )
  }

  return (data || []).map(
    mapProduct
  )
}

// ============================================================
// STOREFRONT CATEGORIES
// ============================================================

export async function fetchStorefrontCategories() {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      image,
      published,
      created_at,
      updated_at
    `)
    .eq('published', true)
    .order('name', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load categories.'
    )
  }

  return (data || []).map(
    mapCategory
  )
}

// ============================================================
// ADMIN CATEGORIES
// ============================================================

export async function fetchCategories() {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      image,
      published,
      created_at,
      updated_at
    `)
    .order('name', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load categories.'
    )
  }

  return (data || []).map(
    mapCategory
  )
}

// ============================================================
// PRODUCT BY ID
// ============================================================

export async function fetchStorefrontProductById(
  productId
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('id', productId)
    .eq('published', true)
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load product.'
    )
  }

  return mapProduct(data)
}

// ============================================================
// ADMIN PRODUCT BY ID
// ============================================================

export async function fetchProductById(
  productId
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('id', productId)
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load product.'
    )
  }

  return mapProduct(data)
}

// ============================================================
// VALIDATE CART STOCK
// ============================================================

export async function validateCartStock(
  cartItems
) {
  if (
    !cartItems ||
    cartItems.length === 0
  ) {
    return {
      valid: true,
      issues: [],
      products: [],
    }
  }

  const storefrontProducts =
    await fetchStorefrontProducts()

  const issues = []

  const validatedProducts =
    cartItems.map((cartItem) => {
      const latestProduct =
        storefrontProducts.find(
          (product) =>
            String(product.id) ===
            String(cartItem.id)
        )

      // --------------------------------------------------------
      // PRODUCT NO LONGER AVAILABLE
      // --------------------------------------------------------

      if (!latestProduct) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            cartItem.name,

          type:
            'NOT_AVAILABLE',

          message:
            `${cartItem.name} is no longer available.`,
        })

        return null
      }

      // --------------------------------------------------------
      // PRODUCT OUT OF STOCK
      // --------------------------------------------------------

      if (
        latestProduct.currentStock <= 0
      ) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            latestProduct.name,

          type:
            'OUT_OF_STOCK',

          message:
            `${latestProduct.name} is currently out of stock.`,
        })

        return latestProduct
      }

      // --------------------------------------------------------
      // CART QUANTITY EXCEEDS STOCK
      // --------------------------------------------------------

      if (
        cartItem.quantity >
        latestProduct.currentStock
      ) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            latestProduct.name,

          type:
            'INSUFFICIENT_STOCK',

          requested:
            cartItem.quantity,

          available:
            latestProduct.currentStock,

          message:
            `Only ${latestProduct.currentStock} of ${latestProduct.name} are currently available, but your cart contains ${cartItem.quantity}.`,
        })
      }

      // --------------------------------------------------------
      // CART QUANTITY BELOW MINIMUM
      // --------------------------------------------------------

      const minimumQuantity =
        latestProduct.effectiveMinQuantity ??
        latestProduct.minQuantity ??
        1

      if (
        cartItem.quantity <
        minimumQuantity
      ) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            latestProduct.name,

          type:
            'BELOW_MINIMUM',

          requested:
            cartItem.quantity,

          minimum:
            minimumQuantity,

          message:
            `${latestProduct.name} requires a minimum order quantity of ${minimumQuantity}.`,
        })
      }

      // --------------------------------------------------------
      // CART QUANTITY EXCEEDS ADMIN MAXIMUM
      // --------------------------------------------------------

      const maximumQuantity =
        latestProduct.effectiveMaxQuantity ??
        latestProduct.maxQuantity ??
        latestProduct.currentStock

      if (
        cartItem.quantity >
        maximumQuantity
      ) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            latestProduct.name,

          type:
            'EXCEEDS_MAXIMUM',

          requested:
            cartItem.quantity,

          maximum:
            maximumQuantity,

          message:
            `${latestProduct.name} has a maximum order quantity of ${maximumQuantity}.`,
        })
      }

      // --------------------------------------------------------
      // PRODUCT NO LONGER ORDERABLE
      // --------------------------------------------------------

      if (
        !latestProduct.isOrderable
      ) {
        issues.push({
          productId:
            cartItem.id,

          productName:
            latestProduct.name,

          type:
            'NOT_ORDERABLE',

          message:
            `${latestProduct.name} is currently unavailable for ordering.`,
        })
      }

      return latestProduct
    })

  return {
    valid:
      issues.length === 0,

    issues,

    products:
      validatedProducts.filter(
        Boolean
      ),
  }
}

// ============================================================
// UPDATE PRODUCT
// ============================================================

export async function updateProduct(
  productId,
  updates
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to update product.'
    )
  }

  return mapProduct(data)
}

// ============================================================
// CREATE PRODUCT
// ============================================================

export async function createProduct(
  product
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('products')
    .insert(product)
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to create product.'
    )
  }

  return mapProduct(data)
}

// ============================================================
// DELETE PRODUCT
// ============================================================

export async function deleteProduct(
  productId
) {
  const client = requireSupabase()

  const {
    error,
  } = await client
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    throw new Error(
      error.message ||
        'Failed to delete product.'
    )
  }

  return true
}

// ============================================================
// UPDATE CATEGORY
// ============================================================

export async function updateCategory(
  categoryId,
  updates
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to update category.'
    )
  }

  return mapCategory(data)
}

// ============================================================
// CREATE CATEGORY
// ============================================================

export async function createCategory(
  category
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    throw new Error(
      error.message ||
        'Failed to create category.'
    )
  }

  return mapCategory(data)
}

// ============================================================
// DELETE CATEGORY
// ============================================================

export async function deleteCategory(
  categoryId
) {
  const client = requireSupabase()

  const {
    error,
  } = await client
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    throw new Error(
      error.message ||
        'Failed to delete category.'
    )
  }

  return true
}

// ============================================================
// FETCH BEST SELLERS
// ============================================================
//
// Aggregates order_items across Completed orders, grouped by
// product, ranked by units sold.
//
// Deliberately queries order_items + orders directly rather
// than a Supabase view — order_items already stores the
// product's name/code at the time of purchase (see
// orderService.js's createOrder), so this stays accurate even
// for products that have since been edited or deleted.
//

export async function fetchBestSellers(limit = 5) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client
    .from('order_items')
    .select(
      'product_id, product_name, product_code, quantity, item_total, orders!inner(order_status)'
    )
    .eq('orders.order_status', 'Completed')

  if (error) {
    throw new Error(
      error.message ||
        'Failed to load best sellers.'
    )
  }

  const totals = new Map()

  for (const row of data || []) {
    if (!row.product_id) {
      continue
    }

    const existing =
      totals.get(row.product_id) || {
        product_id: row.product_id,
        name: row.product_name || 'Unnamed Product',
        product_code: row.product_code || '',
        units_sold: 0,
        revenue: 0,
      }

    existing.units_sold += Number(row.quantity || 0)
    existing.revenue += Number(row.item_total || 0)

    totals.set(row.product_id, existing)
  }

  return Array.from(totals.values())
    .sort(
      (a, b) => b.units_sold - a.units_sold
    )
    .slice(0, limit)
}