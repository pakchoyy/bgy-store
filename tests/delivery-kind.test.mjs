import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isActivationProduct, orderDeliveryKind } from '../lib/delivery-kind.mjs'

const lisensi = { title: 'Buat Soal PLUS · 3 Bulan', file_url: 'https://www.bantuguruyuk.web.id/aktvs.html?order={order}&sig={sig}' }
const spmb = { title: 'Aktivasi SPMB Zone Pro - 1 Tahun', file_url: 'https://spmbz.web.id/daftar' }
const file = { title: 'LKPD Kata Tanya', file_url: null, file_name: 'lkpd.pdf' }
const drive = { title: 'Kumpulan Soal', file_url: 'https://drive.google.com/file/d/abc' }

test('produk lisensi dikenali dari {order} atau judul aktivasi', () => {
  assert.equal(isActivationProduct(lisensi), true)
  assert.equal(isActivationProduct({ file_url: 'https://x.id/a?order=%7Border%7D' }), true)
  assert.equal(isActivationProduct(spmb), true)
})

test('produk file dan link biasa bukan lisensi', () => {
  assert.equal(isActivationProduct(file), false)
  assert.equal(isActivationProduct(drive), false)
  assert.equal(isActivationProduct(null), false)
  // judul "unlock" tanpa link tidak cukup
  assert.equal(isActivationProduct({ title: 'Unlock sesuatu', file_url: null }), false)
})

test('jenis pesanan: lisensi, file, atau campuran', () => {
  assert.equal(orderDeliveryKind([lisensi, spmb]), 'activation')
  assert.equal(orderDeliveryKind([file, drive]), 'file')
  assert.equal(orderDeliveryKind([lisensi, file]), 'mixed')
  assert.equal(orderDeliveryKind([]), 'file')
})
