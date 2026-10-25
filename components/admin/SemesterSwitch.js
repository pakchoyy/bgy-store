import { assertAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

// Pilihan satu dari tiga, tetap disimpan ke hide_semester_1 / hide_semester_2
const VIEWS = { all: [false, false], 1: [false, true], 2: [true, false] }

async function setSemesterView(formData) {
  'use server'
  await assertAdminAction()
  const [hide1, hide2] = VIEWS[formData.get('view')] || VIEWS.all
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/produk')
  const supabase = await createClient()
  await supabase.from('settings').upsert([
    { key: 'hide_semester_1', value: hide1 ? 'true' : 'false' },
    { key: 'hide_semester_2', value: hide2 ? 'true' : 'false' },
  ], { onConflict: 'key' })
  revalidatePath('/', 'layout')
  redirect('/admin/produk')
}

export default function SemesterSwitch({ products, settings }) {
  const counts = { 1: 0, 2: 0 }
  for (const p of products) if (counts[p.semester] !== undefined) counts[p.semester]++
  const hide1 = settings.hide_semester_1 === 'true'
  const hide2 = settings.hide_semester_2 === 'true'
  const current = !hide1 && !hide2 ? 'all' : !hide1 && hide2 ? '1' : hide1 && !hide2 ? '2' : null
  const options = [['all', 'Semua'], ['1', `Ganjil (${counts[1]})`], ['2', `Genap (${counts[2]})`]]

  return (
    <form action={setSemesterView} className="flex items-center gap-2">
      <span className="shrink-0 text-xs font-semibold text-slate-500">Semester tampil</span>
      <div role="radiogroup" aria-label="Semester yang tampil di toko" className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {options.map(([value, label]) => (
          <button
            key={value}
            name="view"
            value={value}
            role="radio"
            aria-checked={current === value}
            className={`min-h-11 rounded-lg px-1 text-[13px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${current === value ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </form>
  )
}
