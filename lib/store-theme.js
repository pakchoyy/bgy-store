export const themeFonts = {system:'system-ui, sans-serif',Arial:'Arial, sans-serif',Georgia:'Georgia, serif',Verdana:'Verdana, sans-serif'};
export function whiteContrast(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return 0;
  const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return 1.05/(0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2]+0.05);
}
export function themeStyle(settings={}) {
  const primary=whiteContrast(settings.theme_primary_color)>=4.5?settings.theme_primary_color:'#0d7a8a';
  const secondary=whiteContrast(settings.theme_secondary_color)>=4.5?settings.theme_secondary_color:'#2d6a7f';
  const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(' ');
  return {'--brand-rgb':rgb(primary),'--brand-dark-rgb':rgb(secondary),'--brand':primary,'--brand-dark':secondary,'--store-font':Object.hasOwn(themeFonts,settings.theme_font)?themeFonts[settings.theme_font]:themeFonts.system,'--store-radius':({rounded:'16px',slightly:'8px',square:'0px'})[settings.theme_border_radius] || '16px','--store-button-style':settings.theme_button_style==='outline'?'outline':settings.theme_button_style==='soft'?'soft':'solid'};
}
