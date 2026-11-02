import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickHomeReviews } from '../lib/pick-reviews.mjs'

const r = (id, name, comment) => ({ id, reviewer_name: name, comment })

test('komentar sama dari produk PLUS dan PRO hanya tampil sekali', () => {
  const rows = [r(1, 'Sapawi', 'Cepat dan lancar'), r(2, 'Sapawi', 'Cepat dan lancar'), r(3, 'Bu Ayu', 'Sangat terbantu untuk buat soal')]
  assert.deepEqual(pickHomeReviews(rows).map((x) => x.id), [1, 3])
})

test('penulis bernama maksimal satu kali; anonim tidak digabung', () => {
  const rows = [r(1, 'Sapawi', 'Cepat dan lancar'), r(2, 'sapawi', 'Cepat dan akurat sekali'), r(3, 'Guru pengguna BGY', 'mudah,lengkap,memuaskan'), r(4, 'Guru pengguna BGY', 'KEREN DAN MUDAH DIGUNAKAN')]
  assert.deepEqual(pickHomeReviews(rows).map((x) => x.id), [1, 3, 4])
})

test('komentar terlalu pendek atau kosong dilewati, jumlah dibatasi', () => {
  const rows = [r(1, 'A', 'ok'), r(2, 'B', null), ...Array.from({ length: 12 }, (_, i) => r(10 + i, `Guru ${i}`, `Komentar nomor ${i} yang cukup panjang`))]
  const picked = pickHomeReviews(rows, 8)
  assert.equal(picked.length, 8)
  assert.ok(picked.every((x) => x.id >= 10))
})
