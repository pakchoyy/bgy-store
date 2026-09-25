import { createClient } from '@/lib/supabase-server'

const typeColors = {
  api: 'bg-red-100 text-red-700',
  webhook: 'bg-orange-100 text-orange-700',
  auth: 'bg-purple-100 text-purple-700',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(200)
    return data || []
  } catch {
    return []
  }
}

export default async function AdminErrorLog() {
  const logs = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Error Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">200 log terakhir dari sistem</p>
      </div>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Tidak ada error tercatat — bagus!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tipe</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Pesan</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 align-top">
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full ${typeColors[log.type] || 'bg-gray-100 text-gray-600'}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{log.message}</p>
                      {log.detail && (
                        <pre className="mt-1 text-[10px] text-gray-400 bg-gray-50 rounded p-2 overflow-x-auto max-w-md">{JSON.stringify(log.detail, null, 2)}</pre>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
