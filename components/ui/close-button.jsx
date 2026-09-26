export function CloseButton({ onClick, label = 'Tutup', disabled = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/30 ring-2 ring-red-100 transition-[background-color,transform] duration-150 hover:bg-red-600 active:scale-95 disabled:opacity-50 ${className}`}
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
