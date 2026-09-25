import { createClient } from '@/lib/supabase-server'
import NotificationList from '@/components/admin/NotificationList'

async function getData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    return data || []
  } catch {
    return []
  }
}

export default async function AdminNotifikasi() {
  const notifications = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Notifikasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Aktivitas terbaru di toko kamu</p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  )
}
