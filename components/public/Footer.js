import Link from 'next/link';

export default function Footer({ config, links, contacts, siteName }) {
  const getConfig = (key) => config?.find((c) => c.key === key)?.value || '';
  const copyright = getConfig('copyright_text');
  const description = getConfig('description');

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0ea5a0]/20 rounded-lg flex items-center justify-center">
                <span className="text-[#0ea5a0] font-extrabold text-sm">BGY</span>
              </div>
              <span className="text-white font-bold">{siteName || 'Bantu Guru Yuk'}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Tautan</h3>
            <div className="space-y-2">
              {links
                ?.filter((l) => l.is_visible !== false)
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    className="block text-sm text-gray-400 hover:text-[#0ea5a0] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Kontak</h3>
            <div className="space-y-3 text-sm">
              {contacts?.map((contact) => (
                <div key={contact.key} className="flex items-center gap-2">
                  <span className="text-gray-500 capitalize">{contact.label}:</span>
                  <span className="text-gray-400">{contact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
