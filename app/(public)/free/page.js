import { Suspense } from 'react'
import LynkShell from '@/components/public/LynkShell'
import FreePageClient from './FreePageClient'
import { fetchStoreShell, demoShellDataWithProducts, hasSupabase } from '@/lib/store-shell'
import { demoProducts, demoCategories } from '@/lib/demo-data'

async function getData() {
  if (!hasSupabase()) {
    const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('_bgym_demo_products') || '[]') : []
    return demoShellDataWithProducts(
      (saved.length ? saved : demoProducts).filter((p) => p.type === 'free' && p.is_active),
      { categories: demoCategories }
    )
  }

  const shell = await fetchStoreShell()
  return {
    ...shell,
    products: (shell.products || []).filter((p) => p.type === 'free'),
  }
}

export default async function FreePage() {
  const { products, categories, navItems, appearance, footerConfig, announcement, settings } =
    await getData()

  return (
    <LynkShell
      appearance={appearance}
      navItems={navItems}
      footerConfig={footerConfig}
      announcement={announcement}
      activeTabLabel="Gratis"
    >
      <Suspense
        fallback={
          <div className="bg-white/90 rounded-2xl p-6 text-center text-sm text-gray-400">
            Memuat...
          </div>
        }
      >
        <FreePageClient products={products} categories={categories} settings={settings} />
      </Suspense>
    </LynkShell>
  )
}
