'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RecycleBinList({ products: initial }) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [busyId, setBusyId] = useState(null)

  const restore = async (id) => {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal memulihkan produk')
      setProducts(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const deleteForever = async (id) => {
    if (!window.confirm('Hapus permanen? Tindakan ini tidak bisa dibatalkan.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}&permanent=true`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus produk')
      setProducts(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (products.length === 0) {
    return <div className="bg-white rounded-xl shadow-card p-12 text-center text-sm text-gray-400">Recycle bin kosong</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Produk</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Harga</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Dihapus</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                <td className="px-4 py-3 text-gray-700">{p.type === 'free' ? 'Gratis' : formatRupiah(p.sale_price)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{formatDate(p.deleted_at)}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => restore(p.id)}
                    disabled={busyId === p.id}
                    className="text-xs font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] disabled:opacity-50"
                  >
                    Pulihkan
                  </button>
                  <button
                    onClick={() => deleteForever(p.id)}
                    disabled={busyId === p.id}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Hapus Permanen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
