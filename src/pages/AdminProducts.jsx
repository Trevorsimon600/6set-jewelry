import { useMemo, useRef, useState } from 'react'

import {
  createEmptyProduct,
  isValidPrice,
  formatPrice,
} from '../data/adminProductDatabase'

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '../lib/productService'

import {
  createImagePreview,
  revokeImagePreview,
  isValidImageType,
  isValidImageSize,
} from '../lib/imageUploadUtil'

import './AdminAuth.css'

/* ============================================================
   6SET JEWELRY
   ADMIN PRODUCTS

   Architecture preserved:

   - adminProductDatabase.js
   - productService.js
   - imageUploadUtil.js
   - Parent-controlled products
   - Parent-controlled categories
   - Supabase persistence through productService
   - Product CRUD
   - Product visibility
   - Image upload / preview
   - Price validation
   - Price history
   - Search
   ============================================================ */

function AdminProducts({
  products = [],
  setProducts = () => {},
  categories = [],
}) {
  /* ==========================================================
     FORM STATE
     ========================================================== */

  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [draftProduct, setDraftProduct] = useState(() =>
    createEmptyProduct()
  )

  const [editingProductId, setEditingProductId] = useState(null)
  const [draftEdits, setDraftEdits] = useState({})

  /* ==========================================================
     IMAGE UPLOAD STATE
     ========================================================== */

  const [imagePreview, setImagePreview] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)

  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [selectedEditImageFile, setSelectedEditImageFile] =
    useState(null)

  const [editImageRemoved, setEditImageRemoved] = useState(false)

  const [imageUploadError, setImageUploadError] = useState('')
  const [editImageUploadError, setEditImageUploadError] = useState('')

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingEditImage, setIsUploadingEditImage] =
    useState(false)

  /* ==========================================================
     DELETE / VISIBILITY / SAVE STATE
     ========================================================== */

  const [deleteConfirmProductId, setDeleteConfirmProductId] =
    useState(null)

  const [deleteConfirmProductName, setDeleteConfirmProductName] =
    useState('')

  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)

  const [visibilityUpdatingId, setVisibilityUpdatingId] =
    useState(null)

  const [productError, setProductError] = useState('')

  /* ==========================================================
     PRICE VALIDATION / HISTORY
     ========================================================== */

  const [priceValidationError, setPriceValidationError] = useState('')
  const [priceHistoryVisible, setPriceHistoryVisible] =
    useState(null)

  /* ==========================================================
     FILE REFERENCES
     ========================================================== */

  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  /* ==========================================================
     SAFE HELPERS
     ========================================================== */

  function safeString(value) {
    if (value === null || value === undefined) {
      return ''
    }

    return String(value)
  }

  function safeNumber(value, fallback = 0) {
    const number = Number(value)

    return Number.isFinite(number) ? number : fallback
  }

  function getProductName(product) {
    return safeString(
      product?.name ??
        product?.productName ??
        product?.title
    )
  }

  function getProductCategory(product) {
    return safeString(
      product?.category ??
        product?.categoryName ??
        ''
    )
  }

  function getProductCode(product) {
    return safeString(
      product?.productCode ??
        product?.product_code ??
        ''
    )
  }

  function getProductPrice(product) {
    return safeNumber(
      product?.price ??
        product?.unitPrice ??
        product?.unit_price ??
        0
    )
  }

  function getProductStock(product) {
    return safeNumber(
      product?.currentStock ??
        product?.current_stock ??
        product?.stock ??
        0
    )
  }

  function getProductAvailability(product) {
    const stock = getProductStock(product)

    /*
     * Availability is intentionally derived from stock.
     *
     * We do NOT trust a possibly missing availability field
     * coming from Supabase.
     */

    if (stock <= 0) {
      return 'Out of Stock'
    }

    const threshold = safeNumber(
      product?.lowStockThreshold ??
        product?.low_stock_threshold ??
        0
    )

    if (threshold > 0 && stock <= threshold) {
      return 'Low Stock'
    }

    return 'In Stock'
  }

  function getProductPublished(product) {
    return Boolean(
      product?.published ??
        product?.isPublished ??
        product?.is_published ??
        false
    )
  }

  function getProductImage(product) {
    return safeString(
      product?.mainImage ??
        product?.main_image ??
        product?.image ??
        ''
    )
  }

  function getProductDescription(product) {
    return safeString(
      product?.description ?? ''
    )
  }

  /* ==========================================================
     NORMALIZE PRODUCTS FOR UI

     This does NOT change the database.

     It creates a safe UI representation so missing Supabase
     values cannot crash the component.
     ========================================================== */

  const normalizedProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }

    return products.map((product) => {
      const safeProduct = product || {}

      return {
        ...safeProduct,

        id: safeProduct.id ?? '',

        name: getProductName(safeProduct),

        category: getProductCategory(safeProduct),

        productCode: getProductCode(safeProduct),

        price: getProductPrice(safeProduct),

        currentStock: getProductStock(safeProduct),

        availability:
          safeString(safeProduct.availability).trim() ||
          getProductAvailability(safeProduct),

        published: getProductPublished(safeProduct),

        mainImage: getProductImage(safeProduct),

        description: getProductDescription(safeProduct),

        lowStockThreshold: safeNumber(
          safeProduct.lowStockThreshold ??
            safeProduct.low_stock_threshold ??
            0
        ),

        initialStock: safeNumber(
          safeProduct.initialStock ??
            safeProduct.initial_stock ??
            0
        ),

        minimumOrderQuantity: safeNumber(
          safeProduct.minimumOrderQuantity ??
            safeProduct.minimum_order_quantity ??
            1,
          1
        ),

        maximumOrderQuantity: safeNumber(
          safeProduct.maximumOrderQuantity ??
            safeProduct.maximum_order_quantity ??
            10,
          10
        ),

        priceHistory: Array.isArray(
          safeProduct.priceHistory
        )
          ? safeProduct.priceHistory
          : [],
      }
    })
  }, [products])

  /* ==========================================================
     CATEGORY NAMES
     ========================================================== */

  const categoryNames = useMemo(() => {
    if (!Array.isArray(categories)) {
      return []
    }

    return categories
      .map((category) =>
        safeString(category?.name).trim()
      )
      .filter(Boolean)
  }, [categories])

  /* ==========================================================
     FILTERED PRODUCTS

     Defensive against undefined fields.
     ========================================================== */

  const filteredProducts = useMemo(() => {
    const term = safeString(searchTerm)
      .trim()
      .toLowerCase()

    if (!term) {
      return normalizedProducts
    }

    return normalizedProducts.filter((product) => {
      const haystack = [
        getProductName(product),
        getProductCategory(product),
        getProductCode(product),
      ]
        .map((value) =>
          safeString(value).toLowerCase()
        )
        .join(' ')

      return haystack.includes(term)
    })
  }, [normalizedProducts, searchTerm])

  /* ==========================================================
     INPUT CHANGE
     ========================================================== */

  function handleInputChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    if (name === 'price') {
      if (value && !isValidPrice(value)) {
        setPriceValidationError(
          'Price must be a positive number'
        )
      } else {
        setPriceValidationError('')
      }
    }

    setDraftProduct((current) => ({
      ...current,

      [name]:
        type === 'checkbox'
          ? checked
          : value,

      ...(name === 'category'
        ? {
            categoryId:
              categories.find(
                (category) =>
                  safeString(category?.name) === value
              )?.id || '',
          }
        : {}),
    }))
  }

  /* ==========================================================
     EDIT INPUT CHANGE
     ========================================================== */

  function handleEditChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    if (name === 'price') {
      if (value && !isValidPrice(value)) {
        setPriceValidationError(
          'Price must be a positive number'
        )
      } else {
        setPriceValidationError('')
      }
    }

    setDraftEdits((current) => ({
      ...current,

      [name]:
        type === 'checkbox'
          ? checked
          : value,

      ...(name === 'category'
        ? {
            categoryId:
              categories.find(
                (category) =>
                  safeString(category?.name) === value
              )?.id || '',
          }
        : {}),
    }))
  }

  /* ==========================================================
     IMAGE SELECT — CREATE
     ========================================================== */

  async function handleImageSelect(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setImageUploadError('')

    if (!isValidImageType(file)) {
      setImageUploadError(
        'Invalid format. Use JPG, PNG, WebP, or HEIC.'
      )
      return
    }

    if (!isValidImageSize(file)) {
      setImageUploadError(
        'File too large. Maximum 10 MB.'
      )
      return
    }

    try {
      setIsUploadingImage(true)

      if (
        imagePreview?.isLocal &&
        imagePreview?.url
      ) {
        revokeImagePreview(imagePreview.url)
      }

      const previewUrl =
        createImagePreview(file)

      setImagePreview({
        url: previewUrl,
        isLocal: true,
      })

      setSelectedImageFile(file)

      setDraftProduct((current) => ({
        ...current,
        mainImage: '',
      }))
    } catch (err) {
      setImageUploadError(
        err?.message ||
          'Upload failed'
      )

      setImagePreview(null)
    } finally {
      setIsUploadingImage(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /* ==========================================================
     IMAGE SELECT — EDIT
     ========================================================== */

  async function handleEditImageSelect(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setEditImageUploadError('')

    if (!isValidImageType(file)) {
      setEditImageUploadError(
        'Invalid format. Use JPG, PNG, WebP, or HEIC.'
      )
      return
    }

    if (!isValidImageSize(file)) {
      setEditImageUploadError(
        'File too large. Maximum 10 MB.'
      )
      return
    }

    try {
      setIsUploadingEditImage(true)

      if (
        editImagePreview?.isLocal &&
        editImagePreview?.url
      ) {
        revokeImagePreview(
          editImagePreview.url
        )
      }

      const previewUrl =
        createImagePreview(file)

      setEditImagePreview({
        url: previewUrl,
        isLocal: true,
      })

      setSelectedEditImageFile(file)
      setEditImageRemoved(false)
    } catch (err) {
      setEditImageUploadError(
        err?.message ||
          'Upload failed'
      )

      setEditImagePreview(null)
    } finally {
      setIsUploadingEditImage(false)

      if (editFileInputRef.current) {
        editFileInputRef.current.value = ''
      }
    }
  }

  /* ==========================================================
     REMOVE CREATE IMAGE
     ========================================================== */

  function removeImage() {
    if (
      imagePreview?.isLocal &&
      imagePreview?.url
    ) {
      revokeImagePreview(imagePreview.url)
    }

    setImagePreview(null)
    setSelectedImageFile(null)

    setDraftProduct((current) => ({
      ...current,
      mainImage: '',
    }))
  }

  /* ==========================================================
     REMOVE EDIT IMAGE
     ========================================================== */

  function removeEditImage() {
    if (
      editImagePreview?.isLocal &&
      editImagePreview?.url
    ) {
      revokeImagePreview(
        editImagePreview.url
      )
    }

    setEditImagePreview(null)
    setSelectedEditImageFile(null)
    setEditImageRemoved(true)

    setDraftEdits((current) => ({
      ...current,
      mainImage: '',
    }))
  }

  /* ==========================================================
     RESET CREATE FORM
     ========================================================== */

  function resetDraft() {
    if (
      imagePreview?.isLocal &&
      imagePreview?.url
    ) {
      revokeImagePreview(imagePreview.url)
    }

    setImagePreview(null)
    setSelectedImageFile(null)

    setImageUploadError('')
    setPriceValidationError('')

    setDraftProduct(
      createEmptyProduct()
    )

    setShowAddForm(false)
  }

  /* ==========================================================
     START EDIT
     ========================================================== */

  function startEditProduct(product) {
    const safeProduct = product || {}

    setProductError('')
    setEditingProductId(
      safeProduct.id ?? null
    )

    setDraftEdits({
      ...safeProduct,

      name: getProductName(safeProduct),

      category:
        getProductCategory(safeProduct),

      productCode:
        getProductCode(safeProduct),

      price:
        getProductPrice(safeProduct),

      currentStock:
        getProductStock(safeProduct),

      availability:
        getProductAvailability(safeProduct),
    })

    const image =
      getProductImage(safeProduct)

    setEditImagePreview(
      image
        ? {
            url: image,
            isLocal: false,
          }
        : null
    )

    setSelectedEditImageFile(null)
    setEditImageRemoved(false)
    setEditImageUploadError('')
    setPriceHistoryVisible(null)
  }

  /* ==========================================================
     CANCEL EDIT
     ========================================================== */

  function cancelEdit() {
    if (
      editImagePreview?.isLocal &&
      editImagePreview?.url
    ) {
      revokeImagePreview(
        editImagePreview.url
      )
    }

    setEditingProductId(null)
    setDraftEdits({})
    setEditImagePreview(null)
    setSelectedEditImageFile(null)
    setEditImageRemoved(false)

    setEditImageUploadError('')
    setPriceValidationError('')
    setPriceHistoryVisible(null)
  }

  /* ==========================================================
     CREATE PRODUCT
     ========================================================== */

  async function handleSubmit(event) {
    event.preventDefault()

    setProductError('')

    if (
      !isValidPrice(
        draftProduct.price
      )
    ) {
      setPriceValidationError(
        'Price must be a positive number'
      )
      return
    }

    const productToCreate = {
      ...draftProduct,

      productCode:
        draftProduct.productCode ||
        `6SET-${String(
          normalizedProducts.length + 1
        ).padStart(3, '0')}`,

      published: true,
    }

    try {
      setIsSavingProduct(true)

      const createdProduct =
        await createProduct(
          productToCreate,
          {
            imageFile:
              selectedImageFile ||
              undefined,
          }
        )

      setProducts((current) => [
        createdProduct,
        ...current,
      ])

      resetDraft()
    } catch (error) {
      setProductError(
        error?.message ||
          'Failed to create product.'
      )
    } finally {
      setIsSavingProduct(false)
    }
  }

  /* ==========================================================
     SAVE PRODUCT EDIT
     ========================================================== */

  async function handleSaveEdit(event) {
    event.preventDefault()

    setProductError('')

    if (
      draftEdits.price &&
      !isValidPrice(
        draftEdits.price
      )
    ) {
      setPriceValidationError(
        'Price must be a positive number'
      )
      return
    }

    try {
      setIsUpdatingProduct(true)

      const updatedProduct =
        await updateProduct(
          editingProductId,
          draftEdits,
          {
            imageFile:
              selectedEditImageFile ||
              undefined,

            removePrimaryImage:
              editImageRemoved,
          }
        )

      setProducts((current) =>
        current.map((product) =>
          product.id === editingProductId
            ? updatedProduct
            : product
        )
      )

      cancelEdit()
    } catch (error) {
      setProductError(
        error?.message ||
          'Failed to update product.'
      )
    } finally {
      setIsUpdatingProduct(false)
    }
  }

  /* ==========================================================
     DELETE CONFIRMATION
     ========================================================== */

  function startDeleteConfirm(product) {
    setProductError('')

    setDeleteConfirmProductId(
      product?.id ?? null
    )

    setDeleteConfirmProductName(
      getProductName(product)
    )
  }

  function cancelDelete() {
    setDeleteConfirmProductId(null)
    setDeleteConfirmProductName('')
  }

  /* ==========================================================
     DELETE PRODUCT
     ========================================================== */

  async function confirmDelete() {
    if (!deleteConfirmProductId) {
      return
    }

    try {
      setIsDeletingProduct(true)

      await deleteProduct(
        deleteConfirmProductId
      )

      setProducts((current) =>
        current.filter(
          (product) =>
            product.id !==
            deleteConfirmProductId
        )
      )

      cancelDelete()
    } catch (error) {
      setProductError(
        error?.message ||
          'Failed to delete product.'
      )
    } finally {
      setIsDeletingProduct(false)
    }
  }

  /* ==========================================================
     TOGGLE PRODUCT VISIBILITY
     ========================================================== */

  async function toggleProductVisibility(
    product
  ) {
    if (!product?.id) {
      return
    }

    setProductError('')

    try {
      setVisibilityUpdatingId(
        product.id
      )

      const updatedProduct =
        await updateProduct(
          product.id,
          {
            ...product,

            published:
              !getProductPublished(
                product
              ),
          }
        )

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? updatedProduct
            : item
        )
      )
    } catch (error) {
      setProductError(
        error?.message ||
          'Failed to update product visibility.'
      )
    } finally {
      setVisibilityUpdatingId(null)
    }
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="admin-products-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="admin-section-header">
        <div>
          <p className="admin-eyebrow">
            PRODUCTS
          </p>

          <h2>
            Products
          </h2>
        </div>

        <button
          type="button"
          className="admin-action-button"
          onClick={() =>
            setShowAddForm(
              (current) => !current
            )
          }
        >
          {showAddForm
            ? 'Close Form'
            : '+ Add Product'}
        </button>
      </div>

      {/* ======================================================
          GLOBAL ERROR
          ====================================================== */}

      {productError && (
        <p
          className="admin-operation-error"
          role="alert"
        >
          {productError}
        </p>
      )}

      {/* ======================================================
          ADD PRODUCT FORM
          ====================================================== */}

      {showAddForm && (
        <form
          className="admin-product-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-product-form-grid">

            <label>
              Product name

              <input
                type="text"
                name="name"
                value={
                  draftProduct.name || ''
                }
                onChange={handleInputChange}
                placeholder="e.g. Pearl Earrings"
                required
              />
            </label>

            <label>
              Product code

              <input
                type="text"
                name="productCode"
                value={
                  draftProduct.productCode ||
                  ''
                }
                onChange={handleInputChange}
                placeholder="6SET-010"
              />
            </label>

            <label>
              Category

              <select
                name="category"
                value={
                  draftProduct.category ||
                  ''
                }
                onChange={handleInputChange}
              >
                {categoryNames.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Price (KES)

              <input
                type="number"
                name="price"
                value={
                  draftProduct.price ?? ''
                }
                onChange={handleInputChange}
                min="0"
                required
              />

              {priceValidationError && (
                <span className="admin-price-error">
                  {priceValidationError}
                </span>
              )}
            </label>

            <label>
              Initial Stock

              <input
                type="number"
                name="initialStock"
                value={
                  draftProduct.initialStock ??
                  0
                }
                onChange={handleInputChange}
                min="0"
                required
              />
            </label>

            <label>
              Current Stock

              <input
                type="number"
                name="currentStock"
                value={
                  draftProduct.currentStock ??
                  0
                }
                onChange={handleInputChange}
                min="0"
                required
              />
            </label>

            <label>
              Low Stock Threshold

              <input
                type="number"
                name="lowStockThreshold"
                value={
                  draftProduct.lowStockThreshold ??
                  0
                }
                onChange={handleInputChange}
                min="0"
              />
            </label>

            <label>
              Min Order Quantity

              <input
                type="number"
                name="minimumOrderQuantity"
                value={
                  draftProduct.minimumOrderQuantity ??
                  1
                }
                onChange={handleInputChange}
                min="1"
              />
            </label>

            <label>
              Max Order Quantity

              <input
                type="number"
                name="maximumOrderQuantity"
                value={
                  draftProduct.maximumOrderQuantity ??
                  10
                }
                onChange={handleInputChange}
                min="1"
              />
            </label>

            <label>
              Availability

              <input
                type="text"
                value={getProductAvailability(
                  draftProduct
                )}
                disabled
                style={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                }}
              />

              <small
                style={{
                  color: '#7f5a85',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Auto-calculated from current stock
              </small>
            </label>

            {/* ==================================================
                CREATE IMAGE
                ================================================== */}

            <label className="admin-product-full-span">
              Product Image

              <div className="admin-image-upload-section">

                {!imagePreview ? (
                  <label className="admin-image-upload-box">

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={
                        handleImageSelect
                      }
                      accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                      style={{
                        display: 'none',
                      }}
                      disabled={
                        isUploadingImage
                      }
                    />

                    <div className="admin-image-upload-content">

                      <div className="admin-image-upload-icon">
                        📸
                      </div>

                      <span className="admin-image-upload-text">
                        {isUploadingImage
                          ? 'Preparing...'
                          : 'Tap to upload image'}
                      </span>

                      <small>
                        JPG, PNG, WebP, HEIC • Up to 10 MB
                      </small>

                    </div>
                  </label>
                ) : (
                  <div className="admin-image-preview-box">

                    <img
                      src={imagePreview.url}
                      alt="Preview"
                      className="admin-image-preview-img"
                    />

                    <div className="admin-image-preview-actions">

                      <button
                        type="button"
                        className="admin-mini-button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={
                          isUploadingImage
                        }
                      >
                        Replace
                      </button>

                      <button
                        type="button"
                        className="admin-mini-button danger"
                        onClick={removeImage}
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                )}

              </div>

              {imageUploadError && (
                <span className="admin-upload-error">
                  {imageUploadError}
                </span>
              )}
            </label>

            {/* ==================================================
                DESCRIPTION
                ================================================== */}

            <label className="admin-product-full-span">
              Description

              <textarea
                name="description"
                value={
                  draftProduct.description ||
                  ''
                }
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe the product"
              />
            </label>

          </div>

          <div className="admin-product-form-actions">

            <button
              type="submit"
              className="admin-action-button"
              disabled={
                isSavingProduct ||
                isUploadingImage
              }
            >
              {isSavingProduct
                ? 'Saving...'
                : 'Save Product'}
            </button>

            <button
              type="button"
              className="admin-mini-button ghost"
              onClick={resetDraft}
            >
              Cancel
            </button>

          </div>
        </form>
      )}

      {/* ======================================================
          EDIT PRODUCT MODAL
          ====================================================== */}

      {editingProductId && (
        <div
          className="admin-edit-modal-overlay"
          onClick={cancelEdit}
        >
          <form
            className="admin-edit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={handleSaveEdit}
          >

            <div className="admin-edit-modal-header">

              <h3>
                Edit Product
              </h3>

              <button
                type="button"
                className="admin-modal-close"
                onClick={cancelEdit}
              >
                ✕
              </button>

            </div>

            {productError && (
              <p
                className="admin-operation-error"
                role="alert"
              >
                {productError}
              </p>
            )}

            <div className="admin-product-form-grid">

              <label>
                Product name

                <input
                  type="text"
                  name="name"
                  value={
                    draftEdits.name || ''
                  }
                  onChange={handleEditChange}
                  required
                />
              </label>

              <label>
                Product code

                <input
                  type="text"
                  name="productCode"
                  value={
                    draftEdits.productCode ||
                    ''
                  }
                  onChange={handleEditChange}
                />
              </label>

              <label>
                Category

                <select
                  name="category"
                  value={
                    draftEdits.category ||
                    ''
                  }
                  onChange={handleEditChange}
                >
                  {categoryNames.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Price (KES)

                <input
                  type="number"
                  name="price"
                  value={
                    draftEdits.price ?? 0
                  }
                  onChange={handleEditChange}
                  min="0"
                  required
                />

                {priceValidationError && (
                  <span className="admin-price-error">
                    {priceValidationError}
                  </span>
                )}
              </label>

              <label>
                Initial Stock

                <input
                  type="number"
                  name="initialStock"
                  value={
                    draftEdits.initialStock ??
                    0
                  }
                  onChange={handleEditChange}
                  min="0"
                  required
                />
              </label>

              <label>
                Current Stock

                <input
                  type="number"
                  name="currentStock"
                  value={
                    draftEdits.currentStock ??
                    0
                  }
                  onChange={handleEditChange}
                  min="0"
                  required
                />
              </label>

              <label>
                Low Stock Threshold

                <input
                  type="number"
                  name="lowStockThreshold"
                  value={
                    draftEdits.lowStockThreshold ??
                    0
                  }
                  onChange={handleEditChange}
                  min="0"
                />
              </label>

              <label>
                Min Order Quantity

                <input
                  type="number"
                  name="minimumOrderQuantity"
                  value={
                    draftEdits.minimumOrderQuantity ??
                    1
                  }
                  onChange={handleEditChange}
                  min="1"
                />
              </label>

              <label>
                Max Order Quantity

                <input
                  type="number"
                  name="maximumOrderQuantity"
                  value={
                    draftEdits.maximumOrderQuantity ??
                    10
                  }
                  onChange={handleEditChange}
                  min="1"
                />
              </label>

              <label>
                Availability

                <input
                  type="text"
                  value={getProductAvailability(
                    draftEdits
                  )}
                  disabled
                  style={{
                    opacity: 0.6,
                    cursor: 'not-allowed',
                  }}
                />

                <small
                  style={{
                    color: '#7f5a85',
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  Auto-calculated from current stock
                </small>
              </label>

              {/* ==================================================
                  EDIT IMAGE
                  ================================================== */}

              <label className="admin-product-full-span">
                Product Image

                <div className="admin-image-upload-section">

                  {!editImagePreview ? (
                    <label className="admin-image-upload-box">

                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={
                          handleEditImageSelect
                        }
                        accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                        style={{
                          display: 'none',
                        }}
                        disabled={
                          isUploadingEditImage
                        }
                      />

                      <div className="admin-image-upload-content">

                        <div className="admin-image-upload-icon">
                          📸
                        </div>

                        <span className="admin-image-upload-text">
                          {isUploadingEditImage
                            ? 'Preparing...'
                            : 'Tap to upload image'}
                        </span>

                        <small>
                          JPG, PNG, WebP, HEIC • Up to 10 MB
                        </small>

                      </div>

                    </label>
                  ) : (
                    <div className="admin-image-preview-box">

                      <img
                        src={editImagePreview.url}
                        alt="Preview"
                        className="admin-image-preview-img"
                      />

                      <div className="admin-image-preview-actions">

                        <button
                          type="button"
                          className="admin-mini-button"
                          onClick={() =>
                            editFileInputRef.current?.click()
                          }
                          disabled={
                            isUploadingEditImage
                          }
                        >
                          Replace
                        </button>

                        <button
                          type="button"
                          className="admin-mini-button danger"
                          onClick={
                            removeEditImage
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  )}

                </div>

                {editImageUploadError && (
                  <span className="admin-upload-error">
                    {editImageUploadError}
                  </span>
                )}

              </label>

              {/* ==================================================
                  EDIT DESCRIPTION
                  ================================================== */}

              <label className="admin-product-full-span">
                Description

                <textarea
                  name="description"
                  value={
                    draftEdits.description ||
                    ''
                  }
                  onChange={handleEditChange}
                  rows="4"
                />
              </label>

              {/* ==================================================
                  PRICE HISTORY
                  ================================================== */}

              <div className="admin-price-history-section">

                <button
                  type="button"
                  className="admin-price-history-toggle"
                  onClick={() =>
                    setPriceHistoryVisible(
                      priceHistoryVisible ===
                        editingProductId
                        ? null
                        : editingProductId
                    )
                  }
                >
                  📊 Price History (
                  {
                    (
                      normalizedProducts.find(
                        (product) =>
                          product.id ===
                          editingProductId
                      )?.priceHistory ||
                      []
                    ).length
                  }
                  )
                </button>

                {priceHistoryVisible ===
                  editingProductId && (
                  <div className="admin-price-history-list">

                    {(
                      normalizedProducts.find(
                        (product) =>
                          product.id ===
                          editingProductId
                      )?.priceHistory ||
                      []
                    ).map(
                      (entry, index) => (
                        <div
                          key={
                            entry?.id ??
                            index
                          }
                          className="admin-price-history-entry"
                        >
                          <strong>
                            {formatPrice(
                              safeNumber(
                                entry?.price
                              )
                            )}
                          </strong>

                          <small>
                            {entry?.changedAt
                              ? new Date(
                                  entry.changedAt
                                ).toLocaleString()
                              : 'Date unavailable'}
                          </small>
                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

            <div className="admin-product-form-actions">

              <button
                type="submit"
                className="admin-action-button"
                disabled={
                  isUpdatingProduct ||
                  isUploadingEditImage
                }
              >
                {isUpdatingProduct
                  ? 'Updating...'
                  : 'Update Product'}
              </button>

              <button
                type="button"
                className="admin-mini-button ghost"
                onClick={cancelEdit}
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ======================================================
          DELETE MODAL
          ====================================================== */}

      {deleteConfirmProductId && (
        <div
          className="admin-delete-modal-overlay"
          onClick={cancelDelete}
        >
          <div
            className="admin-delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <h3>
              Delete Product?
            </h3>

            <p>
              Are you sure you want to permanently
              delete{' '}
              <strong>
                {deleteConfirmProductName}
              </strong>
              ? This action cannot be undone.
            </p>

            {productError && (
              <p
                className="admin-operation-error"
                role="alert"
              >
                {productError}
              </p>
            )}

            <div className="admin-delete-modal-actions">

              <button
                type="button"
                className="admin-mini-button danger"
                onClick={confirmDelete}
                disabled={
                  isDeletingProduct
                }
              >
                {isDeletingProduct
                  ? 'Deleting...'
                  : 'Delete Permanently'}
              </button>

              <button
                type="button"
                className="admin-mini-button ghost"
                onClick={cancelDelete}
                disabled={
                  isDeletingProduct
                }
              >
                Cancel
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          SEARCH
          ====================================================== */}

      <div className="admin-product-toolbar">

        <input
          type="text"
          placeholder="Search products..."
          className="admin-product-search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
        />

      </div>

      {/* ======================================================
          PRODUCT TABLE
          ====================================================== */}

      <div className="admin-product-table-wrap">

        <table className="admin-product-table">

          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                  }}
                >
                  No products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map(
                (product) => {
                  const name =
                    getProductName(
                      product
                    )

                  const category =
                    getProductCategory(
                      product
                    )

                  const price =
                    getProductPrice(
                      product
                    )

                  const stock =
                    getProductStock(
                      product
                    )

                  const availability =
                    getProductAvailability(
                      product
                    )

                  const published =
                    getProductPublished(
                      product
                    )

                  const image =
                    getProductImage(
                      product
                    )

                  const availabilityClass =
                    availability
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        '-'
                      )

                  return (
                    <tr
                      key={
                        product.id ||
                        getProductCode(
                          product
                        ) ||
                        name
                      }
                    >

                      {/* IMAGE */}

                      <td>
                        <img
                          src={
                            image ||
                            'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=85'
                          }
                          alt={
                            name ||
                            'Product'
                          }
                          className="admin-product-thumb"
                        />
                      </td>

                      {/* PRODUCT */}

                      <td>
                        <div className="admin-product-name-block">

                          <strong>
                            {name ||
                              'Unnamed Product'}
                          </strong>

                          {getProductCode(
                            product
                          ) && (
                            <small>
                              {getProductCode(
                                product
                              )}
                            </small>
                          )}

                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        {category ||
                          'Uncategorized'}
                      </td>

                      {/* PRICE */}

                      <td>
                        {formatPrice(
                          price
                        )}
                      </td>

                      {/* STOCK */}

                      <td>

                        <span
                          className={`admin-product-stock ${
                            stock <= 0
                              ? 'out-of-stock'
                              : ''
                          }`}
                        >
                          {stock > 0
                            ? `${stock} available`
                            : 'OUT OF STOCK'}
                        </span>

                        <span
                          className={`admin-stock-badge ${availabilityClass}`}
                        >
                          {availability}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`admin-product-status ${
                            published
                              ? 'published'
                              : 'hidden'
                          }`}
                        >
                          {published
                            ? '✓ Published'
                            : '🙈 Hidden'}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="admin-product-actions">

                          <button
                            type="button"
                            className="admin-mini-button"
                            onClick={() =>
                              startEditProduct(
                                product
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`admin-mini-button ${
                              published
                                ? 'ghost'
                                : ''
                            }`}
                            onClick={() =>
                              toggleProductVisibility(
                                product
                              )
                            }
                            disabled={
                              visibilityUpdatingId ===
                              product.id
                            }
                          >
                            {visibilityUpdatingId ===
                            product.id
                              ? 'Saving...'
                              : published
                                ? 'Hide'
                                : 'Show'}
                          </button>

                          <button
                            type="button"
                            className="admin-mini-button danger"
                            onClick={() =>
                              startDeleteConfirm(
                                product
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                }
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}

export default AdminProducts