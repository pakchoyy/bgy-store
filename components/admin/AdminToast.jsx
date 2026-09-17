export default function AdminToast({ toast, message }) {
  if (!toast) return null

  const isSuccess = toast === 'success'
  const isDemo = toast === 'demo'
  const isError = toast === 'error'
  const text = message || (isDemo
    ? 'Mode demo, data tidak disimpan'
    : isSuccess
      ? 'Perubahan berhasil disimpan'
      : 'Terjadi kesalahan')

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4">
      <div
        role={isError ? 'alert' : 'status'}
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-2xl ${
          isError
            ? 'border-red-100 text-red-700'
            : isDemo
              ? 'border-amber-100 text-amber-700'
              : 'border-emerald-100 text-emerald-700'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isError
              ? 'bg-red-50'
              : isDemo
                ? 'bg-amber-50'
                : 'bg-emerald-50'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {isSuccess ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : isDemo ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            )}
          </svg>
        </span>
        <span>{text}</span>
      </div>
    </div>
  )
}
