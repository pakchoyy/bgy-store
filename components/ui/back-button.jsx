import Link from 'next/link'

export function BackButton({ href, label = 'Kembali', showLabel = false, className = '' }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition-[background-color,transform] duration-150 hover:bg-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${showLabel ? 'pl-2.5 pr-3.5' : 'w-9'} ${className}`}
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 18l-6-6 6-6" />
      </svg>
      {showLabel && <span>{label}</span>}
    </Link>
  )
}
