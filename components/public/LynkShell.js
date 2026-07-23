import AnnouncementBar from '@/components/public/AnnouncementBar'
import Footer from '@/components/public/Footer'
import PageTabs from '@/components/public/PageTabs'
import SocialIcons from '@/components/public/SocialIcons'

export default function LynkShell({
  appearance,
  navItems,
  footerConfig,
  announcement,
  children,
  activeTabLabel,
}) {
  const {
    profileName,
    profileHandle,
    profileAbout,
    profileAvatarUrl,
    bannerUrl,
    bannerEnabled,
    bgColor,
    bgStyle,
    socialLinks,
    siteName,
  } = appearance || {}

  const bg =
    bgStyle === 'flat'
      ? { backgroundColor: bgColor || '#0ea5a0' }
      : {
          backgroundImage: `linear-gradient(180deg, ${bgColor || '#0ea5a0'} 0%, ${bgColor || '#0ea5a0'}cc 35%, #f0fdfa 70%, #f8fafc 100%)`,
        }

  return (
    <div className="min-h-screen" style={bg}>
      {announcement && (
        <AnnouncementBar
          text={announcement.text}
          url={announcement.url}
          bgColor={announcement.bgColor}
          textColor={announcement.textColor}
        />
      )}

      <div className="max-w-md mx-auto px-4 pt-8 pb-6">
        <header className="text-center text-white mb-4">
          <div className="w-20 h-20 mx-auto rounded-full border-[3px] border-white/50 shadow-lg overflow-hidden bg-white/20 mb-3">
            {profileAvatarUrl ? (
              <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-extrabold">
                {(profileName || 'BGY').slice(0, 3).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-lg font-extrabold drop-shadow-sm">{profileName}</h1>
          {profileHandle && (
            <p className="text-sm text-white/85 font-semibold mt-0.5">{profileHandle}</p>
          )}
          {profileAbout && (
            <p className="text-sm text-white/90 mt-2 leading-relaxed max-w-xs mx-auto">
              {profileAbout}
            </p>
          )}
          <SocialIcons links={socialLinks} className="mt-3" />
        </header>

        {bannerEnabled && bannerUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg mb-4 border border-white/20">
            <img src={bannerUrl} alt="Banner" className="w-full h-auto object-cover" />
          </div>
        )}

        <PageTabs items={navItems} />

        {activeTabLabel && (
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider mt-3 mb-2 px-1">
            {activeTabLabel}
          </p>
        )}

        <main className="mt-2">{children}</main>
      </div>

      <Footer config={footerConfig} siteName={siteName || profileName} />
    </div>
  )
}
