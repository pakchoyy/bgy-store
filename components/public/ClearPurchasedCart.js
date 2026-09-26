'use client'

import { useEffect } from 'react'
import { removeCartItem } from '@/lib/cart'

export default function ClearPurchasedCart({ productIds = [] }) {
  const key = productIds.join(',')
  useEffect(() => {
    for (const id of key.split(',').filter(Boolean)) removeCartItem(id)
  }, [key])
  return null
}
