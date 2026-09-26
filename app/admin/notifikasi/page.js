import { createClient } from '@/lib/supabase-server'
import NotificationList from '@/components/admin/NotificationList'
import AdminTabs, { ACTIVITY_TABS } from '@/components/admin/AdminTabs'

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
    <div>
      <AdminTabs tabs={ACTIVITY_TABS} active="notifikasi" />
      <p className="mb-4 text-sm text-gray-500">Aktivitas terbaru di toko kamu</p>
      <NotificationList notifications={notifications} />
    </div>
  )
}
