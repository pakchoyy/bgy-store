import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWebhookPayload } from '../lib/mayar-webhook.mjs'

test('status lunas dikenali', () => {
  for (const status of ['paid', 'SETTLED', 'success', 'payment.received.paid', 'completed']) {
    assert.equal(normalizeWebhookPayload({ data: { status } }).isPaid, true, status)
  }
})

test('status belum lunas tidak dianggap lunas', () => {
  for (const status of ['unpaid', 'not_paid', 'pending', 'unsuccessful', 'incomplete', 'expired', 'failed', 'cancelled', '']) {
    assert.equal(normalizeWebhookPayload({ data: { status } }).isPaid, false, status)
  }
})

test('status gagal dikenali', () => {
  assert.equal(normalizeWebhookPayload({ data: { status: 'expired' } }).isFailed, true)
  assert.equal(normalizeWebhookPayload({ data: { status: 'paid' } }).isFailed, false)
})

test('id pesanan diambil dari metadata lalu referensi', () => {
  const id = '11111111-2222-3333-4444-555555555555'
  assert.equal(normalizeWebhookPayload({ data: { metadata: { order_id: id } } }).localOrderId, id)
  assert.equal(normalizeWebhookPayload({ data: { referenceId: id } }).localOrderId, id)
  assert.equal(normalizeWebhookPayload({ data: { id: 'inv_1', status: 'paid' } }).mayarId, 'inv_1')
})
