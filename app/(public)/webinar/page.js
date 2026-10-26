import LynkShell from '@/components/public/LynkShell'
import ProductStack from '@/components/public/ProductStack'
import { fetchStoreShell, demoShellData, hasSupabase } from '@/lib/store-shell'
import { demoProducts } from '@/lib/demo-data'

export const metadata = {
  title: 'Webinar | Kreacy',
  description: 'Jadwal webinar dan kelas online untuk guru dari Kreacy.',
}

export const revalidate = 30
export const dynamic = 'force-static'

export default async function WebinarPage() {
  const data = hasSupabase() ? await fetchStoreShell() : demoShellData({ products: demoProducts })
  const { navItems, appearance, footerConfig, announcement } = data
  // Produk yang punya tanggal acara (diisi di Admin > Produk > Waktu acara)
  const events = (data.products || []).filter((p) => p.event_at)
  const now = Date.now()
  const upcoming = events.filter((p) => new Date(p.event_at).getTime() >= now).sort((a, b) => new Date(a.event_at) - new Date(b.event_at))
  const past = events.filter((p) => new Date(p.event_at).getTime() < now).sort((a, b) => new Date(b.event_at) - new Date(a.event_at))

  return (
    <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} topBarTitle="Webinar" activeTabLabel="Webinar">
      <div className="space-y-4">
        <ProductStack products={upcoming} emptyText="Belum ada webinar terjadwal. Pantau terus ya!" />
        {past.length > 0 && (
          <section className="space-y-2">
            <h2 className="px-1 text-sm font-bold text-white">Sudah berlangsung</h2>
            <ProductStack products={past} emptyText="" />
          </section>
        )}
      </div>
    </LynkShell>
  )
}
