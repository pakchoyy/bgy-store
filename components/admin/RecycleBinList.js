'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RecycleBinList({ products: initial }) {
  const router = useRouter()
  const { addToast } = useToast()
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
      addToast('Produk berhasil dipulihkan', 'success')
      router.refresh()
    } catch (e) {
      addToast(e.message, 'error')
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
      addToast('Produk berhasil dihapus permanen', 'success')
      router.refresh()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (products.length === 0) {
    return <Card className="p-12 text-center text-sm text-slate-500">Recycle bin kosong</Card>
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Produk</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Harga</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase hidden sm:table-cell">Dihapus</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                <td className="px-4 py-3 text-slate-700">{p.type === 'free' ? 'Gratis' : formatRupiah(p.sale_price)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs hidden sm:table-cell">{formatDate(p.deleted_at)}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => restore(p.id)}
                    disabled={busyId === p.id}
                  >
                    ↶ Pulihkan
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteForever(p.id)}
                    disabled={busyId === p.id}
                  >
                    🗑️ Hapus
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
