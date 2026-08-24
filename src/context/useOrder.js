import {
  useContext,
} from 'react'

import {
  OrderContext,
} from './OrderContext'


// ============================================================
// USE ORDER
// ============================================================

export function useOrder() {

  return useContext(
    OrderContext
  )
}