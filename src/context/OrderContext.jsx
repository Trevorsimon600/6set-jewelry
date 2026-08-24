import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createOrder as createSupabaseOrder,
  fetchOrderByNumber,
  submitPayment as submitSupabasePayment,
} from '../lib/orderService'

export const OrderContext = createContext()

// ============================================================
// ORDER PROVIDER
// ============================================================

export function OrderProvider({
  children,
}) {

  // ==========================================================
  // CURRENT ORDER
  // ==========================================================

  const [
    currentOrder,
    setCurrentOrder,
  ] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          'sixset-current-order'
        )

      return saved
        ? JSON.parse(saved)
        : null

    } catch (error) {

      console.error(
        'Could not load current order:',
        error
      )

      return null
    }

  })


  // ==========================================================
  // ORDER HISTORY
  // ==========================================================

  const [
    orders,
    setOrders,
  ] = useState([])


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(false)


  // ==========================================================
  // ERROR
  // ==========================================================

  const [
    error,
    setError,
  ] = useState(null)


  // ==========================================================
  // SAVE CURRENT ORDER LOCALLY
  // ==========================================================

  useEffect(() => {

    if (currentOrder) {

      localStorage.setItem(
        'sixset-current-order',
        JSON.stringify(
          currentOrder
        )
      )

    }

  }, [currentOrder])


  // ==========================================================
  // CREATE ORDER
  // ==========================================================

  const createOrder = useCallback(async ({
    customer,
    cartItems,
    subtotal,
  }) => {

    setLoading(true)
    setError(null)

    try {

      const order =
        await createSupabaseOrder({
          customer,
          cartItems,
          subtotal,
        })


      // ----------------------------------------------
      // SAVE CURRENT ORDER
      // ----------------------------------------------

      setCurrentOrder(order)


      // ----------------------------------------------
      // ADD TO LOCAL SESSION HISTORY
      // ----------------------------------------------

      setOrders((current) => [

        order,

        ...current.filter(
          (existing) =>
            existing.orderNumber !==
            order.orderNumber
        ),

      ])


      return order

    } catch (err) {

      console.error(
        'Create order failed:',
        err
      )


      setError(
        err.message ||
          'Unable to create order.'
      )


      throw err

    } finally {

      setLoading(false)

    }

  }, [])


  // ==========================================================
  // SUBMIT PAYMENT
  // ==========================================================

  const submitPayment = useCallback(async (
    orderNumberOrOptions,
    maybePaymentReference
  ) => {

    // ----------------------------------------------
    // NORMALIZE ARGUMENTS
    // ----------------------------------------------
    //
    // Supports both calling conventions:
    //
    //   submitPayment(orderNumber, paymentReference)
    //   submitPayment({ orderNumber, paymentReference })
    //

    const orderNumber =
      typeof orderNumberOrOptions === 'string'
        ? orderNumberOrOptions
        : orderNumberOrOptions?.orderNumber

    const paymentReference =
      typeof maybePaymentReference === 'string'
        ? maybePaymentReference
        : orderNumberOrOptions?.paymentReference


    setLoading(true)
    setError(null)

    try {

      const updatedOrder =
        await submitSupabasePayment({
          orderNumber,
          paymentReference,
        })


      if (!updatedOrder) {

        throw new Error(
          'The order could not be updated.'
        )

      }


      // ----------------------------------------------
      // CURRENT ORDER
      // ----------------------------------------------

      setCurrentOrder(
        updatedOrder
      )


      // ----------------------------------------------
      // ORDER SESSION HISTORY
      // ----------------------------------------------

      setOrders((current) => [

        updatedOrder,

        ...current.filter(
          (order) =>
            order.orderNumber !==
            updatedOrder.orderNumber
        ),

      ])


      return { order: updatedOrder }

    } catch (err) {

      console.error(
        'Payment submission failed:',
        err
      )


      setError(
        err.message ||
          'Unable to submit payment.'
      )


      throw err

    } finally {

      setLoading(false)

    }

  }, [])


  // ==========================================================
  // GET ORDER
  // ==========================================================

  const getOrder = useCallback(async (
    orderNumber
  ) => {

    if (!orderNumber) {
      return null
    }


    // ----------------------------------------------
    // CURRENT ORDER
    // ----------------------------------------------

    if (
      currentOrder &&
      currentOrder.orderNumber ===
        orderNumber
    ) {

      return currentOrder

    }


    // ----------------------------------------------
    // LOCAL SESSION HISTORY
    // ----------------------------------------------

    const localOrder =
      orders.find(
        (order) =>
          order.orderNumber ===
          orderNumber
      )


    if (localOrder) {

      return localOrder

    }


    // ----------------------------------------------
    // SUPABASE
    // ----------------------------------------------

    try {

      const order =
        await fetchOrderByNumber(
          orderNumber
        )


      if (order) {

        setCurrentOrder(
          order
        )


        setOrders((current) => [

          order,

          ...current.filter(
            (existing) =>
              existing.orderNumber !==
              order.orderNumber
          ),

        ])

      }


      return order

    } catch (err) {

      console.error(
        'Get order failed:',
        err
      )


      setError(
        err.message ||
          'Unable to load order.'
      )


      return null

    }

  }, [currentOrder, orders])


  // ==========================================================
  // SET ACTIVE ORDER
  // ==========================================================

  const setActiveOrder = useCallback(async (
    orderNumber
  ) => {

    const order =
      await getOrder(
        orderNumber
      )


    return order

  }, [getOrder])


  // ==========================================================
  // CLEAR CURRENT ORDER
  // ==========================================================

  const clearCurrentOrder = useCallback(() => {

    setCurrentOrder(null)

    localStorage.removeItem(
      'sixset-current-order'
    )

  }, [])


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      currentOrder,
      orders,
      loading,
      error,
      createOrder,
      submitPayment,
      getOrder,
      setActiveOrder,
      clearCurrentOrder,
    }),
    [
      currentOrder,
      orders,
      loading,
      error,
      createOrder,
      submitPayment,
      getOrder,
      setActiveOrder,
      clearCurrentOrder,
    ]
  )


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <OrderContext.Provider
      value={value}
    >

      {children}

    </OrderContext.Provider>

  )

}


// ============================================================
// USE ORDER
// ============================================================

export function useOrder() {

  return useContext(
    OrderContext
  )

}