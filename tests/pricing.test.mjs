import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectivePrice, computeTotal } from '../lib/pricing.mjs'

const now = Date.parse('2026-10-23T10:00:00Z')
const paid = (sale_price, extra = {}) => ({ type: 'paid', sale_price, ...extra })

test('flash sale aktif dipakai, yang sudah lewat tidak', () => {
  assert.equal(effectivePrice(paid(20000, { flash_price: 15000, flash_ends_at: '2026-10-24T00:00:00Z' }), now).price, 15000)
  assert.equal(effectivePrice(paid(20000, { flash_price: 15000, flash_ends_at: '2026-10-22T00:00:00Z' }), now).price, 20000)
  assert.equal(effectivePrice(paid(20000, { flash_price: 25000, flash_ends_at: '2026-10-24T00:00:00Z' }), now).price, 20000)
})

test('total tanpa voucher dan dengan voucher persen dibulatkan ke bawah', () => {
  assert.deepEqual(computeTotal([paid(25000), paid(18000)], null, now), { subtotal: 43000, discount: 0, total: 43000 })
  assert.deepEqual(computeTotal([paid(25555)], { discount_type: 'percent', discount_value: 10 }, now), { subtotal: 25555, discount: 2555, total: 23000 })
})

test('voucher rupiah tidak membuat total minus; gratis 100% diizinkan', () => {
  assert.deepEqual(computeTotal([paid(5000)], { discount_type: 'fixed', discount_value: 9000 }, now), { subtotal: 5000, discount: 5000, total: 0 })
})

test('total di bawah Rp1.000 (bukan nol) ditolak', () => {
  assert.ok(computeTotal([paid(5000)], { discount_type: 'fixed', discount_value: 4500 }, now).error)
})

test('voucher kedaluwarsa, belum mulai, kuota habis, atau minimal belanja ditolak', () => {
  const items = [paid(20000)]
  assert.ok(computeTotal(items, { discount_type: 'fixed', discount_value: 1000, ends_at: '2026-10-01' }, now).error)
  assert.ok(computeTotal(items, { discount_type: 'fixed', discount_value: 1000, starts_at: '2026-11-01' }, now).error)
  assert.ok(computeTotal(items, { discount_type: 'fixed', discount_value: 1000, max_uses: 5, used_count: 5 }, now).error)
  assert.ok(computeTotal(items, { discount_type: 'fixed', discount_value: 1000, min_order_amount: 50000 }, now).error)
})

test('voucher khusus produk: potongan hanya dari produk yang cocok', () => {
  const v = { discount_type: 'fixed', discount_value: 15000, product_ids: ['a'] }
  assert.deepEqual(computeTotal([paid(17000, { id: 'a' })], v, now), { subtotal: 17000, discount: 15000, total: 2000 })
  assert.ok(computeTotal([paid(17000, { id: 'b' })], v, now).error)
  assert.deepEqual(computeTotal([paid(17000, { id: 'a' }), paid(5000, { id: 'b' })], { ...v, discount_value: 20000 }, now), { subtotal: 22000, discount: 17000, total: 5000 })
  assert.deepEqual(computeTotal([paid(17000, { id: 'b' })], { ...v, product_ids: null }, now), { subtotal: 17000, discount: 15000, total: 2000 })
})

import { isFlexiblePrice, resolveChosenPrice, lowestPrice } from '../lib/pricing.mjs'

test('nominal pilihan: pilihan tetap, isi sendiri, batas minimal', () => {
  const webinar = { type: 'paid', sale_price: 20000, price_options: [50000, 20000, 40000], allow_custom_price: true, min_price: 15000 }
  assert.equal(isFlexiblePrice(webinar), true)
  assert.deepEqual(resolveChosenPrice(webinar, 40000), { price: 40000 })
  assert.deepEqual(resolveChosenPrice(webinar, 17500), { price: 17500 })
  assert.ok(resolveChosenPrice(webinar, 10000).error)
  assert.ok(resolveChosenPrice(webinar, undefined).error)
  assert.equal(lowestPrice(webinar), 15000)
  const fixedOnly = { ...webinar, allow_custom_price: false }
  assert.ok(resolveChosenPrice(fixedOnly, 30000).error)
  assert.equal(lowestPrice(fixedOnly), 20000)
  // produk biasa: nominal dari pembeli diabaikan
  assert.deepEqual(resolveChosenPrice({ type: 'paid', sale_price: 17000 }, 1), { price: 17000 })
})
