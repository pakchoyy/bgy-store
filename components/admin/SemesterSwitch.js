import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

async function toggleSemester(formData) {
  'use server'
  const semester = formData.get('semester') === '2' ? 2 : 1
  const hide = formData.get('hide') === 'true'
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/admin/produk')
  const supabase = await createClient()
  await supabase.from('settings').upsert({ key: `hide_semester_${semester}`, value: hide ? 'true' : 'false' }, { onConflict: 'key' })
  revalidatePath('/', 'layout')
  redirect('/admin/produk')
}

export default function SemesterSwitch({ products, settings }) {
  const counts = { 1: 0, 2: 0 }
  for (const p of products) if (counts[p.semester] !== undefined) counts[p.semester]++

  return (
    <section className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm" title="Matikan untuk menyembunyikan semua produk semester itu dari toko">
      <h2 className="shrink-0 text-xs font-semibold text-slate-500">Semester</h2>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {[1, 2].map((semester) => {
          const hidden = settings[`hide_semester_${semester}`] === 'true'
          return (
            <form key={semester} action={toggleSemester}>
              <input type="hidden" name="semester" value={semester} />
              <input type="hidden" name="hide" value={hidden ? 'false' : 'true'} />
              <button
                role="switch"
                aria-checked={!hidden}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${hidden ? 'text-slate-400' : 'text-slate-700'}`}>{semester === 1 ? 'Ganjil' : 'Genap'} <span className="text-xs text-slate-400">({counts[semester]})</span></span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hidden ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${hidden ? 'left-0.5' : 'left-[22px]'}`} />
                </span>
              </button>
            </form>
          )
        })}
      </div>
    </section>
  )
}
