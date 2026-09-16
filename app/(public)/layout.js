import { createClient } from '@/lib/supabase-server';
import { themeStyle } from '@/lib/store-theme';
import ScrollToTopButton from '@/components/public/ScrollToTopButton';
export default async function PublicLayout({children}) {
  const db=await createClient();
  const {data}=await db.from('settings').select('key,value').in('key',['theme_primary_color','theme_secondary_color','theme_border_radius','theme_font','theme_button_style']);
  const settings=Object.fromEntries((data || []).map(row=>[row.key,row.value]));
  return <div className="store-theme" data-button-style={settings.theme_button_style || 'solid'} style={themeStyle(settings)}>{children}<ScrollToTopButton /></div>;
}
