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
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-sm font-extrabold text-slate-700">Tampilkan produk per semester</h2>
      <p className="mt-0.5 text-xs text-slate-500">Matikan satu semester untuk menyembunyikan semua produknya dari toko. Produk tanpa label semester selalu tampil.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[1, 2].map((semester) => {
          const hidden = settings[`hide_semester_${semester}`] === 'true'
          return (
            <form key={semester} action={toggleSemester}>
              <input type="hidden" name="semester" value={semester} />
              <input type="hidden" name="hide" value={hidden ? 'false' : 'true'} />
              <button
                role="switch"
                aria-checked={!hidden}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors ${hidden ? 'bg-slate-50 ring-slate-200' : 'bg-emerald-50 ring-emerald-200'}`}
              >
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${hidden ? 'text-slate-500' : 'text-emerald-800'}`}>Semester {semester}</span>
                  <span className="block text-[11px] text-slate-500">{counts[semester]} produk · {hidden ? 'disembunyikan' : 'tampil'}</span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hidden ? 'bg-slate-300' : 'bg-emerald-600'}`}>
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
