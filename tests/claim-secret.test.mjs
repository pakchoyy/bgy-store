import { test } from 'node:test'
import assert from 'node:assert/strict'
import { claimSecretFor } from '../lib/claim-secret.mjs'

const env = { KLAIM_HMAC_SECRET: 'umum', KLAIM_HMAC_SECRET_BGY: 'bgy', KLAIM_HMAC_SECRET_WKELAS: 'wkelas' }

test('tiap domain memakai rahasianya sendiri', () => {
  assert.equal(claimSecretFor('https://www.bantuguruyuk.web.id/aktvs-ma.html?order={order}&sig={sig}', env), 'bgy')
  assert.equal(claimSecretFor('https://wkelas.web.id/aktvs-wk.html?order={order}&sig={sig}', env), 'wkelas')
  assert.equal(claimSecretFor('https://www.wkelas.web.id/x?order={order}', env), 'wkelas')
  assert.equal(claimSecretFor('https://presiswa.bantuguruyuk.web.id/klaim?order={order}', env), 'umum', 'subdomain Presensi tetap rahasia umum')
})

test('domain mirip tidak ikut memakai rahasia Wkelas', () => {
  assert.equal(claimSecretFor('https://wkelas.web.id.palsu.com/x', env), 'umum')
  assert.equal(claimSecretFor('http://wkelas.web.id/x', env), 'umum', 'hanya https')
})

test('bila rahasia khusus belum diisi, kembali ke rahasia umum (perilaku lama)', () => {
  assert.equal(claimSecretFor('https://wkelas.web.id/x', { KLAIM_HMAC_SECRET: 'umum' }), 'umum')
  assert.equal(claimSecretFor('https://wkelas.web.id/x', {}), null)
})
