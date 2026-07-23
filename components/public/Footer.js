export default function Footer({ config, siteName }) {
  const getConfig = (key) => config?.find((c) => c.key === key)?.value || ''
  const copyright = getConfig('copyright_text')
  const description = getConfig('description')

  return (
    <footer className="mt-4 pb-10">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow-sm px-5 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#0ea5a0]/15 rounded-lg flex items-center justify-center">
              <span className="text-[#0ea5a0] font-extrabold text-xs">BGY</span>
            </div>
            <span className="text-sm font-extrabold text-gray-900">
              {siteName || 'Bantu Guru Yuk'}
            </span>
          </div>
          {description && (
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          )}
          {copyright && (
            <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
              {copyright}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
