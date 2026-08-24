/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

// =================================
// CART PROVIDER
// =================================

export function CartProvider({ children }) {

  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem('sixset-cart')

      if (savedCart) {
        return JSON.parse(savedCart)
      }

      return []
    } catch (error) {
      console.error(
        'Could not load cart:',
        error
      )

      return []
    }
  })

  // =================================
  // SAVE CART
  // =================================

  function saveCart(updatedCart) {
    setCartItems(updatedCart)

    localStorage.setItem(
      'sixset-cart',
      JSON.stringify(updatedCart)
    )
  }

  // =================================
  // GET EFFECTIVE MAXIMUM
  // =================================
  //
  // The customer can never select more
  // than the smaller of:
  //
  // 1. Admin maximum order quantity
  // 2. Current available stock
  //
  // Example:
  //
  // Admin maximum = 10
  // Current stock = 3
  //
  // Maximum allowed = 3
  //

  function getEffectiveMaxQuantity(product) {
    const configuredMaximum =
      Number(
        product.maxQuantity ?? 10
      )

    const currentStock =
      Number(
        product.currentStock ?? 0
      )

    return Math.min(
      Math.max(configuredMaximum, 0),
      Math.max(currentStock, 0)
    )
  }

  // =================================
  // GET EFFECTIVE MINIMUM
  // =================================
  //
  // The minimum remains the product's
  // configured minimum.
  //
  // If stock is below that minimum,
  // the product cannot be added.
  //

  function getEffectiveMinQuantity(product) {
    const minimum =
      Number(
        product.minQuantity ?? 1
      )

    const currentStock =
      Number(
        product.currentStock ?? 0
      )

    if (
      currentStock < minimum
    ) {
      return 0
    }

    return Math.max(
      minimum,
      1
    )
  }

  // =================================
  // ADD TO CART
  // =================================

  function addToCart(
    product,
    quantity = 1
  ) {

    const currentStock =
      Number(
        product.currentStock ?? 0
      )

    // =================================
    // NO STOCK
    // =================================

    if (currentStock <= 0) {
      console.warn(
        `Cannot add "${product.name}" to cart because it is out of stock.`
      )

      return false
    }

    // =================================
    // QUANTITY LIMITS
    // =================================

    const minimumQuantity =
      getEffectiveMinQuantity(
        product
      )

    const maximumQuantity =
      getEffectiveMaxQuantity(
        product
      )

    // =================================
    // STOCK CANNOT SATISFY MINIMUM
    // =================================

    if (
      minimumQuantity <= 0 ||
      maximumQuantity < minimumQuantity
    ) {
      console.warn(
        `Cannot add "${product.name}" to cart because available stock is below the minimum order quantity.`
      )

      return false
    }

    // =================================
    // EXISTING ITEM
    // =================================

    const existingItem =
      cartItems.find(
        (item) =>
          item.id === product.id
      )

    if (existingItem) {

      const newQuantity =
        Math.min(
          existingItem.quantity +
            quantity,
          maximumQuantity
        )

      if (
        newQuantity ===
        existingItem.quantity
      ) {
        return false
      }

      const updatedCart =
        cartItems.map(
          (item) => {

            if (
              item.id === product.id
            ) {
              return {
                ...item,

                quantity:
                  newQuantity,

                // Refresh inventory information
                // from the latest product data.
                currentStock:
                  currentStock,

                maxQuantity:
                  product.maxQuantity,
              }
            }

            return item
          }
        )

      saveCart(updatedCart)

      return true
    }

    // =================================
    // NEW ITEM
    // =================================

    const safeQuantity =
      Math.min(
        Math.max(
          Number(quantity) ||
            minimumQuantity,
          minimumQuantity
        ),
        maximumQuantity
      )

    const newItem = {
      ...product,

      quantity:
        safeQuantity,

      currentStock:
        currentStock,
    }

    saveCart([
      ...cartItems,
      newItem,
    ])

    return true
  }

  // =================================
  // REMOVE FROM CART
  // =================================

  function removeFromCart(productId) {

    const updatedCart =
      cartItems.filter(
        (item) =>
          item.id !== productId
      )

    saveCart(updatedCart)
  }

  // =================================
  // UPDATE QUANTITY
  // =================================

  function updateQuantity(
    productId,
    newQuantity
  ) {

    const item =
      cartItems.find(
        (cartItem) =>
          cartItem.id === productId
      )

    if (!item) {
      return false
    }

    // =================================
    // CURRENT STOCK
    // =================================

    const currentStock =
      Number(
        item.currentStock ?? 0
      )

    // =================================
    // QUANTITY LIMITS
    // =================================

    const minimumQuantity =
      getEffectiveMinQuantity(
        item
      )

    const maximumQuantity =
      getEffectiveMaxQuantity(
        item
      )

    // =================================
    // OUT OF STOCK
    // =================================

    if (
      currentStock <= 0
    ) {
      return false
    }

    // =================================
    // VALIDATE QUANTITY
    // =================================

    if (
      newQuantity <
        minimumQuantity ||
      newQuantity >
        maximumQuantity
    ) {
      return false
    }

    // =================================
    // UPDATE CART
    // =================================

    const updatedCart =
      cartItems.map(
        (cartItem) => {

          if (
            cartItem.id ===
            productId
          ) {
            return {
              ...cartItem,

              quantity:
                newQuantity,
            }
          }

          return cartItem
        }
      )

    saveCart(updatedCart)

    return true
  }

  // =================================
  // CLEAR CART
  // =================================

  function clearCart() {
    saveCart([])
  }

  // =================================
  // TOTAL ITEMS
  // =================================

  const totalItems =
    cartItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    )

  // =================================
  // TOTAL PRICE
  // =================================

  const totalPrice =
    cartItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.price *
          item.quantity,
      0
    )

  // =================================
  // CONTEXT
  // =================================

  const value = {
    cartItems,

    addToCart,

    removeFromCart,

    updateQuantity,

    clearCart,

    totalItems,

    totalPrice,
  }

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  )
}

// =================================
// USE CART
// =================================

export function useCart() {

  const context =
    useContext(
      CartContext
    )

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    )
  }

  return context
}