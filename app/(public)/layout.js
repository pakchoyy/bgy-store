import { fetchStoreShell } from '@/lib/store-shell';
import { themeStyle } from '@/lib/store-theme';
import ScrollToTopButton from '@/components/public/ScrollToTopButton';
import AnalyticsTracker from '@/components/public/AnalyticsTracker';
import VoucherCapture from '@/components/public/VoucherCapture';
import PwaSetup from '@/components/public/PwaSetup';
export default async function PublicLayout({children}) {
  const {settings}=await fetchStoreShell();
  return <div className="store-theme" data-button-style={settings.theme_button_style || 'solid'} style={themeStyle(settings)}>{children}<ScrollToTopButton /><AnalyticsTracker /><VoucherCapture /><PwaSetup /></div>;
}
