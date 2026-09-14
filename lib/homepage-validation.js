import { validId } from './admin-content';
import { safeStoreUrl } from './store-settings';
const fields={
  hero:['title','subtitle','cta_text','cta_url','display_name','handle','about','avatar_url','banner_url'],
  featured_products:[],
  categories:[],
  free_products:[],
  promo_banner:['text','cta_text','cta_url','image_url'],
  about:['title','content']
};
export function homepagePayload(input) {
  if(!Array.isArray(input) || input.length<1 || input.length>6) throw new Error('Daftar bagian halaman depan tidak valid.');
  const ids=new Set(),keys=new Set();
  return input.map((section,index)=>{
    if(!section || !validId(section.id) || ids.has(section.id) || !Object.hasOwn(fields,section.key) || keys.has(section.key)) throw new Error('Bagian halaman tidak valid atau duplikat. Muat ulang data tersimpan.');
    ids.add(section.id);keys.add(section.key);
    if(typeof section.label!=='string' || !section.label.trim() || section.label.length>100 || typeof section.is_visible!=='boolean') throw new Error('Lengkapi nama dan status setiap bagian.');
    const source=section.config ?? {};
    if(typeof source!=='object' || Array.isArray(source)) throw new Error('Isi bagian halaman tidak valid.');
    const config={};
    for(const field of fields[section.key]) {
      const value=source[field] ?? '';
      if(typeof value!=='string' || value.length>(field==='content'?10000:2000)) throw new Error('Teks bagian halaman terlalu panjang atau tidak valid.');
      config[field]=value.trim();
    }
    if(config.cta_url && !safeStoreUrl(config.cta_url)) throw new Error('URL tombol harus berupa /alamat-halaman atau URL http/https yang valid.');
    for(const field of ['avatar_url','banner_url','image_url']) {
      if(config[field] && !safeStoreUrl(config[field])) throw new Error('URL gambar harus berasal dari alamat /internal atau http/https yang valid.');
    }
    if(config.cta_text && !config.cta_url) throw new Error('Isi URL tujuan untuk tombol '+config.cta_text+'.');
    return {id:section.id,key:section.key,label:section.label.trim(),is_visible:section.is_visible,sort_order:index+1,config};
  });
}
