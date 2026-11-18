// Pesan sapaan WA untuk pembeli produk digital (bisa diubah di Admin > Pelanggan).
// Link grup sementara pindah ke grup baru (WA lama diblokir). Link lama: https://bit.ly/4bQZUW5
export const DEFAULT_WA_MESSAGE = `Halo Bapak/Ibu Guru Hebat! 👋

Terima kasih sudah beli aplikasi kami.😊

Untuk info aplikasi terbaru, bantuan, kendala, atau memberikan masukan, silakan bergabung ke grup pengguna BGY:
👉 https://chat.whatsapp.com/IS96j9JlbB67vXNOeBbGqD

Terima kasih! 🙏`

export function waPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export async function getWaMessage(supabase) {
  const { data } = await supabase.from('settings').select('value').eq('key', 'wa_customer_message').maybeSingle()
  return data?.value || DEFAULT_WA_MESSAGE
}
