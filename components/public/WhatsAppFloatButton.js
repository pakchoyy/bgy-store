'use client';

const FALLBACK_URL = 'https://wa.me/6289530713597';
const MESSAGE = 'Halo Pak Choy, saya butuh bantuan di toko BGY.';

export default function WhatsAppFloatButton({ waUrl }) {
  const base = waUrl || FALLBACK_URL;
  return (
    <a
      href={`${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat admin via WhatsApp"
      className="fixed bottom-20 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-900/25 ring-1 ring-white/20 transition-transform duration-150 active:scale-[0.96] md:bottom-6 md:left-6"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
    </a>
  );
}
