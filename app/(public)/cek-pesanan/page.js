import LynkShell from '@/components/public/LynkShell'
import OrderLookup from '@/components/public/OrderLookup'
import { fetchStoreShell } from '@/lib/store-shell'
import { whatsappUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cek Pesanan | Bantu Guru Yuk',
  description: 'Cek pembelian dan download ulang file yang sudah dibeli di Bantu Guru Yuk.',
  robots: { index: false },
}

export default async function CekPesananPage() {
  const { navItems, appearance, footerConfig, announcement } = await fetchStoreShell()
  return (
    <LynkShell appearance={appearance} navItems={navItems} footerConfig={footerConfig} announcement={announcement} topBarTitle="Cek Pesanan" pageHasHeading>
      <OrderLookup waUrl={whatsappUrl(appearance?.socialLinks)} />
    </LynkShell>
  )
}
