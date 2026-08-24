import { useMemo, useState } from 'react'

import {
  createImagePreview,
  revokeImagePreview,
  uploadCategoryImageToSupabase,
  isValidImageType,
  isValidImageSize,
} from '../lib/imageUploadUtil'

import {
  createEmptyCategory,
} from '../data/adminProductDatabase'

import {
  createCategory as createCategoryInSupabase,
  deleteCategory as deleteCategoryInSupabase,
  updateCategory as updateCategoryInSupabase,
} from '../lib/categoryService'

import './AdminAuth.css'

function AdminCategories({
  products = [],
  setProducts = () => {},
  categories = [],
  setCategories = () => {},
  onCategoryRenamed = () => {},
}) {
  // =========================================
  // CATEGORY FORM STATE
  // =========================================

  const [showAddForm, setShowAddForm] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  const [draftCategory, setDraftCategory] = useState(() =>
    createEmptyCategory()
  )

  const [editingCategoryId, setEditingCategoryId] =
    useState(null)

  const [draftEdits, setDraftEdits] = useState({})

  // =========================================
  // IMAGE UPLOAD STATE - CREATE
  // =========================================

  const [imagePreview, setImagePreview] = useState('')

  const [selectedImageFile, setSelectedImageFile] =
    useState(null)

  const [imageUploadError, setImageUploadError] =
    useState('')

  const [isUploadingImage, setIsUploadingImage] =
    useState(false)

  // =========================================
  // IMAGE UPLOAD STATE - EDIT
  // =========================================

  const [editImagePreview, setEditImagePreview] =
    useState('')

  const [selectedEditImageFile, setSelectedEditImageFile] =
    useState(null)

  const [editImageUploadError, setEditImageUploadError] =
    useState('')

  const [isUploadingEditImage, setIsUploadingEditImage] =
    useState(false)

  // =========================================
  // DELETE / REASSIGNMENT STATE
  // =========================================

  const [deleteConfirmCategoryId, setDeleteConfirmCategoryId] =
    useState(null)

  const [deleteConfirmCategoryName, setDeleteConfirmCategoryName] =
    useState('')

  const [productsInDeleteCategory, setProductsInDeleteCategory] =
    useState([])

  const [reassignmentTargetId, setReassignmentTargetId] =
    useState('')

  // =========================================
  // OPERATION STATE
  // =========================================

  const [isDeletingCategory, setIsDeletingCategory] =
    useState(false)

  const [isSavingCategory, setIsSavingCategory] =
    useState(false)

  const [isUpdatingCategory, setIsUpdatingCategory] =
    useState(false)

  const [visibilityUpdatingId, setVisibilityUpdatingId] =
    useState(null)

  const [categoryError, setCategoryError] =
    useState('')

  // =========================================
  // FILTER CATEGORIES
  // =========================================

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return categories
    }

    return categories.filter(
      (category) =>
        category.name?.toLowerCase().includes(term) ||
        category.slug?.toLowerCase().includes(term)
    )
  }, [categories, searchTerm])

  // =========================================
  // PRODUCT COUNT
  // =========================================

  function getCategoryProductCount(categoryId) {
    const category = categories.find(
      (item) => item.id === categoryId
    )

    return products.filter(
      (product) =>
        product.categoryId === categoryId ||
        (!product.categoryId &&
          product.category === category?.name)
    ).length
  }

  // =========================================
  // CREATE FORM INPUT
  // =========================================

  function handleInputChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setDraftCategory((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  // =========================================
  // EDIT FORM INPUT
  // =========================================

  function handleEditChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setDraftEdits((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  // =========================================
  // CREATE IMAGE SELECT
  // =========================================

  function handleImageSelect(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setImageUploadError('')

    // Validate type
    if (!isValidImageType(file)) {
      setImageUploadError(
        'Invalid format. Use JPG, PNG, WebP, or HEIC.'
      )

      event.target.value = ''
      return
    }

    // Validate size
    if (!isValidImageSize(file)) {
      setImageUploadError(
        'File too large. Maximum 10 MB.'
      )

      event.target.value = ''
      return
    }

    // Remove previous preview
    if (imagePreview) {
      revokeImagePreview(imagePreview)
    }

    const previewUrl =
      createImagePreview(file)

    setSelectedImageFile(file)
    setImagePreview(previewUrl)
  }

  // =========================================
  // EDIT IMAGE SELECT
  // =========================================

  function handleEditImageSelect(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setEditImageUploadError('')

    // Validate type
    if (!isValidImageType(file)) {
      setEditImageUploadError(
        'Invalid format. Use JPG, PNG, WebP, or HEIC.'
      )

      event.target.value = ''
      return
    }

    // Validate size
    if (!isValidImageSize(file)) {
      setEditImageUploadError(
        'File too large. Maximum 10 MB.'
      )

      event.target.value = ''
      return
    }

    // Remove previous preview
    if (editImagePreview) {
      revokeImagePreview(editImagePreview)
    }

    const previewUrl =
      createImagePreview(file)

    setSelectedEditImageFile(file)
    setEditImagePreview(previewUrl)
  }

  // =========================================
  // REMOVE CREATE IMAGE
  // =========================================

  function removeSelectedImage() {
    if (imagePreview) {
      revokeImagePreview(imagePreview)
    }

    setImagePreview('')
    setSelectedImageFile(null)
    setImageUploadError('')
  }

  // =========================================
  // REMOVE EDIT IMAGE
  // =========================================

  function removeSelectedEditImage() {
    if (editImagePreview) {
      revokeImagePreview(editImagePreview)
    }

    setEditImagePreview('')
    setSelectedEditImageFile(null)
    setEditImageUploadError('')
  }

  // =========================================
  // CREATE CATEGORY
  // =========================================

  async function handleSubmit(event) {
    event.preventDefault()

    setCategoryError('')
    setImageUploadError('')

    if (!draftCategory.name.trim()) {
      setCategoryError(
        'Category name is required.'
      )
      return
    }

    if (
      categories.some(
        (category) =>
          category.name?.toLowerCase() ===
          draftCategory.name
            .trim()
            .toLowerCase()
      )
    ) {
      setCategoryError(
        'Category name already exists.'
      )
      return
    }

    try {
      setIsSavingCategory(true)

      let imageUrl =
        draftCategory.image || ''

      // =====================================
      // UPLOAD CATEGORY IMAGE
      // =====================================

      if (selectedImageFile) {
        setIsUploadingImage(true)

        /*
         * A temporary identifier is used here.
         *
         * The upload helper should place the image
         * inside a category-specific folder.
         */
        const temporaryCategoryId =
          `new-${Date.now()}`

        const uploadResult =
          await uploadCategoryImageToSupabase(
            selectedImageFile,
            temporaryCategoryId
          )

        imageUrl =
          typeof uploadResult === 'string'
            ? uploadResult
            : uploadResult.publicUrl
      }

      // =====================================
      // CREATE CATEGORY
      // =====================================

      const createdCategory =
        await createCategoryInSupabase({
          ...draftCategory,
          image: imageUrl,
        })

      setCategories((current) => [
        createdCategory,
        ...current,
      ])

      resetDraft()
    } catch (error) {
      console.error(
        'Create category error:',
        error
      )

      setCategoryError(
        error.message ||
          'Failed to create category.'
      )
    } finally {
      setIsSavingCategory(false)
      setIsUploadingImage(false)
    }
  }

  // =========================================
  // RESET CREATE FORM
  // =========================================

  function resetDraft() {
    if (imagePreview) {
      revokeImagePreview(imagePreview)
    }

    setDraftCategory(
      createEmptyCategory()
    )

    setImagePreview('')
    setSelectedImageFile(null)
    setImageUploadError('')

    setShowAddForm(false)
  }

  // =========================================
  // START EDIT
  // =========================================

  function startEditCategory(category) {
    setEditingCategoryId(category.id)

    setDraftEdits({
      ...category,
      image: category.image || '',
    })

    setEditImagePreview('')
    setSelectedEditImageFile(null)
    setEditImageUploadError('')
    setCategoryError('')
  }

  // =========================================
  // CANCEL EDIT
  // =========================================

  function cancelEdit() {
    if (editImagePreview) {
      revokeImagePreview(editImagePreview)
    }

    setEditingCategoryId(null)
    setDraftEdits({})

    setEditImagePreview('')
    setSelectedEditImageFile(null)
    setEditImageUploadError('')
  }

  // =========================================
  // SAVE EDIT
  // =========================================

  async function handleSaveEdit(event) {
    event.preventDefault()

    setCategoryError('')
    setEditImageUploadError('')

    if (!draftEdits.name?.trim()) {
      setCategoryError(
        'Category name is required.'
      )
      return
    }

    if (
      categories.some(
        (category) =>
          category.id !==
            editingCategoryId &&
          category.name?.toLowerCase() ===
            draftEdits.name
              .trim()
              .toLowerCase()
      )
    ) {
      setCategoryError(
        'Category name already exists.'
      )
      return
    }

    const oldCategory =
      categories.find(
        (category) =>
          category.id ===
          editingCategoryId
      )

    const oldCategoryName =
      oldCategory?.name

    const newCategoryName =
      draftEdits.name.trim()

    try {
      setIsUpdatingCategory(true)

      let imageUrl =
        draftEdits.image || ''

      // =====================================
      // UPLOAD NEW EDIT IMAGE
      // =====================================

      if (selectedEditImageFile) {
        setIsUploadingEditImage(true)

        const uploadResult =
          await uploadCategoryImageToSupabase(
            selectedEditImageFile,
            editingCategoryId
          )

        imageUrl =
          typeof uploadResult === 'string'
            ? uploadResult
            : uploadResult.publicUrl
      }

      // =====================================
      // UPDATE CATEGORY
      // =====================================

      const updatedCategory =
        await updateCategoryInSupabase(
          editingCategoryId,
          {
            ...draftEdits,
            name: newCategoryName,
            image: imageUrl,
          }
        )

      setCategories((current) =>
        current.map((category) =>
          category.id ===
          editingCategoryId
            ? updatedCategory
            : category
        )
      )

      // =====================================
      // UPDATE PRODUCTS IF RENAMED
      // =====================================

      if (
        oldCategoryName &&
        oldCategoryName !==
          newCategoryName
      ) {
        onCategoryRenamed(
          oldCategoryName,
          newCategoryName
        )
      }

      cancelEdit()
    } catch (error) {
      console.error(
        'Update category error:',
        error
      )

      setCategoryError(
        error.message ||
          'Failed to update category.'
      )
    } finally {
      setIsUpdatingCategory(false)
      setIsUploadingEditImage(false)
    }
  }

  // =========================================
  // START DELETE
  // =========================================

  function startDeleteConfirm(category) {
    const productsWithThisCategory =
      products.filter(
        (product) =>
          product.categoryId ===
            category.id ||
          (!product.categoryId &&
            product.category ===
              category.name)
      )

    setCategoryError('')

    setDeleteConfirmCategoryId(
      category.id
    )

    setDeleteConfirmCategoryName(
      category.name
    )

    setProductsInDeleteCategory(
      productsWithThisCategory
    )

    setReassignmentTargetId('')
  }

  // =========================================
  // CANCEL DELETE
  // =========================================

  function cancelDelete() {
    setDeleteConfirmCategoryId(null)
    setDeleteConfirmCategoryName('')
    setProductsInDeleteCategory([])
    setReassignmentTargetId('')
  }

  // =========================================
  // CONFIRM DELETE
  // =========================================

  async function confirmDelete() {
    if (!deleteConfirmCategoryId) {
      return
    }

    try {
      setIsDeletingCategory(true)

      await deleteCategoryInSupabase(
        deleteConfirmCategoryId,
        {
          reassignToCategoryId:
            reassignmentTargetId ||
            undefined,
        }
      )

      if (
        productsInDeleteCategory.length >
          0 &&
        reassignmentTargetId
      ) {
        const targetCategory =
          categories.find(
            (category) =>
              category.id ===
              reassignmentTargetId
          )

        if (targetCategory) {
          setProducts((current) =>
            current.map((product) =>
              product.categoryId ===
                deleteConfirmCategoryId ||
              (!product.categoryId &&
                product.category ===
                  deleteConfirmCategoryName)
                ? {
                    ...product,
                    categoryId:
                      targetCategory.id,
                    category:
                      targetCategory.name,
                  }
                : product
            )
          )
        }
      }

      setCategories((current) =>
        current.filter(
          (category) =>
            category.id !==
            deleteConfirmCategoryId
        )
      )

      cancelDelete()
    } catch (error) {
      console.error(
        'Delete category error:',
        error
      )

      setCategoryError(
        error.message ||
          'Failed to delete category.'
      )
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // =========================================
  // TOGGLE VISIBILITY
  // =========================================

  async function toggleCategoryVisibility(
    category
  ) {
    setCategoryError('')

    try {
      setVisibilityUpdatingId(
        category.id
      )

      const updatedCategory =
        await updateCategoryInSupabase(
          category.id,
          {
            ...category,
            published:
              !category.published,
          }
        )

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? updatedCategory
            : item
        )
      )
    } catch (error) {
      console.error(
        'Visibility update error:',
        error
      )

      setCategoryError(
        error.message ||
          'Failed to update category visibility.'
      )
    } finally {
      setVisibilityUpdatingId(null)
    }
  }

  // =========================================
  // CATEGORY COUNTS
  // =========================================

  const filteredWithCounts =
    filteredCategories.map(
      (category) => ({
        ...category,
        productCount:
          getCategoryProductCount(
            category.id
          ),
      })
    )

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="admin-categories-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="admin-section-header">

        <div>
          <p className="admin-eyebrow">
            CATEGORIES
          </p>

          <h2>
            Categories
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
            : '+ Add Category'}
        </button>

      </div>

      {/* =====================================
          GLOBAL ERROR
      ====================================== */}

      {categoryError && (
        <p
          className="admin-operation-error"
          role="alert"
        >
          {categoryError}
        </p>
      )}

      {/* =====================================
          ADD CATEGORY FORM
      ====================================== */}

      {showAddForm && (
        <form
          className="admin-category-form"
          onSubmit={handleSubmit}
        >

          <div className="admin-category-form-grid">

            {/* NAME */}

            <label>
              Category name

              <input
                type="text"
                name="name"
                value={
                  draftCategory.name
                }
                onChange={
                  handleInputChange
                }
                placeholder="e.g. Earrings"
                required
              />
            </label>

            {/* SLUG */}

            <label>
              Slug (URL-friendly)

              <input
                type="text"
                name="slug"
                value={
                  draftCategory.slug
                }
                onChange={
                  handleInputChange
                }
                placeholder="e.g. earrings"
              />
            </label>

            {/* DESCRIPTION */}

            <label className="admin-category-full-span">
              Description

              <textarea
                name="description"
                value={
                  draftCategory.description ||
                  ''
                }
                onChange={
                  handleInputChange
                }
                placeholder="Brief description of this category"
                rows="3"
              />
            </label>

            {/* =================================
                CATEGORY PHOTO UPLOAD
            ================================== */}

            <div className="admin-category-full-span">

              <div className="admin-image-upload-label">
                Category photo
              </div>

              <div className="admin-image-upload-frame">

                {imagePreview ? (
                  <div className="admin-image-preview-container">

                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="admin-image-preview"
                    />

                    <div className="admin-image-preview-actions">

                      <label className="admin-mini-button">
                        Change Photo

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                          onChange={
                            handleImageSelect
                          }
                          hidden
                        />
                      </label>

                      <button
                        type="button"
                        className="admin-mini-button danger"
                        onClick={
                          removeSelectedImage
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                ) : (
                  <label className="admin-image-upload-dropzone">

                    <span className="admin-image-upload-icon">
                      📷
                    </span>

                    <strong>
                      Upload a photo
                    </strong>

                    <span>
                      Click to choose a category image
                    </span>

                    <small>
                      JPG, PNG, WebP, HEIC • Up to 10 MB
                    </small>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                      onChange={
                        handleImageSelect
                      }
                      hidden
                    />

                  </label>
                )}

              </div>

              {imageUploadError && (
                <p
                  className="admin-operation-error"
                  role="alert"
                >
                  {imageUploadError}
                </p>
              )}

              {isUploadingImage && (
                <p className="admin-image-upload-status">
                  Uploading category photo...
                </p>
              )}

            </div>

            {/* PUBLISHED */}

            <label className="admin-category-checkbox">

              <input
                type="checkbox"
                name="published"
                checked={
                  draftCategory.published
                }
                onChange={
                  handleInputChange
                }
              />

              Published
              {' '}
              (visible on storefront)

            </label>

          </div>

          {/* FORM ACTIONS */}

          <div className="admin-category-form-actions">

            <button
              type="submit"
              className="admin-action-button"
              disabled={
                isSavingCategory ||
                isUploadingImage
              }
            >
              {isSavingCategory
                ? 'Creating...'
                : 'Create Category'}
            </button>

            <button
              type="button"
              className="admin-mini-button ghost"
              onClick={resetDraft}
              disabled={
                isSavingCategory
              }
            >
              Cancel
            </button>

          </div>

        </form>
      )}

      {/* =====================================
          DELETE MODAL
      ====================================== */}

      {deleteConfirmCategoryId && (
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
              Delete Category?
            </h3>

            <p>
              Are you sure you want to permanently
              delete{' '}
              <strong>
                {
                  deleteConfirmCategoryName
                }
              </strong>
              ?
            </p>

            {productsInDeleteCategory.length >
              0 && (
              <div className="admin-category-delete-warning">

                <p className="admin-warning-label">
                  ⚠️ This category contains{' '}
                  {
                    productsInDeleteCategory.length
                  }{' '}
                  product
                  {productsInDeleteCategory.length !==
                  1
                    ? 's'
                    : ''}
                  :
                </p>

                <ul className="admin-products-list">

                  {productsInDeleteCategory.map(
                    (product) => (
                      <li
                        key={product.id}
                      >
                        {product.name}
                      </li>
                    )
                  )}

                </ul>

                <label className="admin-reassignment-label">

                  Reassign to:

                  <select
                    value={
                      reassignmentTargetId
                    }
                    onChange={(event) =>
                      setReassignmentTargetId(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      -- Select a category --
                    </option>

                    {categories
                      .filter(
                        (category) =>
                          category.id !==
                          deleteConfirmCategoryId
                      )
                      .map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {category.name}
                          </option>
                        )
                      )}

                  </select>

                </label>

                {!reassignmentTargetId && (
                  <p className="admin-reassignment-required">
                    Please select a category to
                    reassign products, or cancel
                    and edit products manually
                    first.
                  </p>
                )}

              </div>
            )}

            <div className="admin-delete-modal-actions">

              <button
                type="button"
                className="admin-mini-button danger"
                onClick={
                  confirmDelete
                }
                disabled={
                  isDeletingCategory ||
                  (
                    productsInDeleteCategory.length >
                      0 &&
                    !reassignmentTargetId
                  )
                }
              >
                {isDeletingCategory
                  ? 'Deleting...'
                  : 'Delete Permanently'}
              </button>

              <button
                type="button"
                className="admin-mini-button ghost"
                onClick={
                  cancelDelete
                }
                disabled={
                  isDeletingCategory
                }
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================
          SEARCH
      ====================================== */}

      <div className="admin-category-toolbar">

        <input
          type="text"
          placeholder="Search categories..."
          className="admin-category-search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
        />

        <div className="admin-category-stats">
          Total: {categories.length}
          {' | '}
          Published:{' '}
          {
            categories.filter(
              (category) =>
                category.published
            ).length
          }
        </div>

      </div>

      {/* =====================================
          CATEGORY TABLE
      ====================================== */}

      <div className="admin-category-table-wrap">

        <table className="admin-category-table">

          <thead>

            <tr>
              <th>
                Category
              </th>

              <th>
                Slug
              </th>

              <th>
                Products
              </th>

              <th>
                Status
              </th>

              <th>
                Actions
              </th>
            </tr>

          </thead>

          <tbody>

            {filteredWithCounts.map(
              (category) => (
                <tr
                  key={category.id}
                >

                  {/* CATEGORY */}

                  <td>

                    <div className="admin-category-table-category">

                      {category.image && (
                        <img
                          src={
                            category.image
                          }
                          alt={
                            category.name
                          }
                          className="admin-category-table-image"
                        />
                      )}

                      <div>

                        <strong>
                          {category.name}
                        </strong>

                        {category.description && (
                          <div className="admin-category-desc">
                            {
                              category.description
                            }
                          </div>
                        )}

                      </div>

                    </div>

                  </td>

                  {/* SLUG */}

                  <td>

                    <code className="admin-category-slug">
                      {
                        category.slug
                      }
                    </code>

                  </td>

                  {/* PRODUCTS */}

                  <td className="admin-category-product-count">
                    {
                      category.productCount
                    }
                  </td>

                  {/* STATUS */}

                  <td>

                    <span
                      className={`admin-product-status ${
                        category.published
                          ? 'published'
                          : 'hidden'
                      }`}
                    >
                      {category.published
                        ? '✓ Published'
                        : '🙈 Hidden'}
                    </span>

                  </td>

                  {/* ACTIONS */}

                  <td>

                    <div className="admin-category-actions">

                      <button
                        type="button"
                        className="admin-mini-button"
                        onClick={() =>
                          startEditCategory(
                            category
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`admin-mini-button ${
                          category.published
                            ? 'ghost'
                            : ''
                        }`}
                        onClick={() =>
                          toggleCategoryVisibility(
                            category
                          )
                        }
                        disabled={
                          visibilityUpdatingId ===
                          category.id
                        }
                      >
                        {visibilityUpdatingId ===
                        category.id
                          ? 'Saving...'
                          : category.published
                          ? 'Hide'
                          : 'Show'}
                      </button>

                      <button
                        type="button"
                        className="admin-mini-button danger"
                        onClick={() =>
                          startDeleteConfirm(
                            category
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

            {filteredWithCounts.length ===
              0 && (
              <tr>
                <td
                  colSpan="5"
                  className="admin-category-empty"
                >
                  No categories found.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* =====================================
          EDIT CATEGORY MODAL
      ====================================== */}

      {editingCategoryId && (
        <div
          className="admin-edit-modal-overlay"
          onClick={cancelEdit}
        >

          <div
            className="admin-edit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-edit-modal-header">

              <h3>
                Edit Category
              </h3>

              <button
                className="admin-modal-close"
                type="button"
                onClick={cancelEdit}
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleSaveEdit
              }
            >

              <div className="admin-category-form-grid">

                {/* NAME */}

                <label>
                  Category name

                  <input
                    type="text"
                    name="name"
                    value={
                      draftEdits.name ||
                      ''
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />
                </label>

                {/* SLUG */}

                <label>
                  Slug

                  <input
                    type="text"
                    name="slug"
                    value={
                      draftEdits.slug ||
                      ''
                    }
                    onChange={
                      handleEditChange
                    }
                  />
                </label>

                {/* DESCRIPTION */}

                <label className="admin-category-full-span">

                  Description

                  <textarea
                    name="description"
                    value={
                      draftEdits.description ||
                      ''
                    }
                    onChange={
                      handleEditChange
                    }
                    rows="3"
                  />

                </label>

                {/* =================================
                    EDIT CATEGORY PHOTO
                ================================== */}

                <div className="admin-category-full-span">

                  <div className="admin-image-upload-label">
                    Category photo
                  </div>

                  <div className="admin-image-upload-frame">

                    {editImagePreview ? (
                      <div className="admin-image-preview-container">

                        <img
                          src={
                            editImagePreview
                          }
                          alt="New category preview"
                          className="admin-image-preview"
                        />

                        <div className="admin-image-preview-actions">

                          <label className="admin-mini-button">
                            Change Photo

                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                              onChange={
                                handleEditImageSelect
                              }
                              hidden
                            />
                          </label>

                          <button
                            type="button"
                            className="admin-mini-button danger"
                            onClick={
                              removeSelectedEditImage
                            }
                          >
                            Remove
                          </button>

                        </div>

                      </div>
                    ) : draftEdits.image ? (
                      <div className="admin-image-preview-container">

                        <img
                          src={
                            draftEdits.image
                          }
                          alt={
                            draftEdits.name ||
                            'Category'
                          }
                          className="admin-image-preview"
                        />

                        <div className="admin-image-preview-actions">

                          <label className="admin-mini-button">
                            Replace Photo

                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                              onChange={
                                handleEditImageSelect
                              }
                              hidden
                            />
                          </label>

                          <button
                            type="button"
                            className="admin-mini-button danger"
                            onClick={() =>
                              setDraftEdits(
                                (current) => ({
                                  ...current,
                                  image: '',
                                })
                              )
                            }
                          >
                            Remove
                          </button>

                        </div>

                      </div>
                    ) : (
                      <label className="admin-image-upload-dropzone">

                        <span className="admin-image-upload-icon">
                          📷
                        </span>

                        <strong>
                          Upload a photo
                        </strong>

                        <span>
                          Click to choose a category image
                        </span>

                        <small>
                          JPG, PNG, WebP, HEIC • Up to 10 MB
                        </small>

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                          onChange={
                            handleEditImageSelect
                          }
                          hidden
                        />

                      </label>
                    )}

                  </div>

                  {editImageUploadError && (
                    <p
                      className="admin-operation-error"
                      role="alert"
                    >
                      {
                        editImageUploadError
                      }
                    </p>
                  )}

                  {isUploadingEditImage && (
                    <p className="admin-image-upload-status">
                      Uploading new category photo...
                    </p>
                  )}

                </div>

                {/* PUBLISHED */}

                <label className="admin-category-checkbox">

                  <input
                    type="checkbox"
                    name="published"
                    checked={
                      draftEdits.published ||
                      false
                    }
                    onChange={
                      handleEditChange
                    }
                  />

                  Published

                </label>

              </div>

              {/* EDIT ACTIONS */}

              <div className="admin-category-form-actions">

                <button
                  type="submit"
                  className="admin-action-button"
                  disabled={
                    isUpdatingCategory ||
                    isUploadingEditImage
                  }
                >
                  {isUpdatingCategory
                    ? 'Updating...'
                    : 'Update Category'}
                </button>

                <button
                  type="button"
                  className="admin-mini-button ghost"
                  onClick={
                    cancelEdit
                  }
                  disabled={
                    isUpdatingCategory
                  }
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default AdminCategories