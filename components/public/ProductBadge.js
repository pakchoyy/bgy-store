export default function ProductBadge({ badge, badgeCustom }) {
  if (!badge) return null;

  const label = badge === 'custom' ? badgeCustom : badge;
  if (!label) return null;

  // Lynk.id style colorful badges
  const colorMap = {
    baru: 'bg-gradient-to-r from-orange-400 to-orange-500',
    terlaris: 'bg-gradient-to-r from-blue-500 to-blue-600',
    diskon: 'bg-gradient-to-r from-red-500 to-red-600',
    gratis: 'bg-gradient-to-r from-green-500 to-green-600',
    premium: 'bg-gradient-to-r from-purple-500 to-purple-600',
    custom: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-white text-[11px] font-bold px-3 py-1.5 rounded-full uppercase shadow-sm transition-transform duration-200 hover:scale-105 ${
        colorMap[badge] || 'bg-gradient-to-r from-slate-500 to-slate-600'
      }`}
      style={{ letterSpacing: '0.5px' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
      {label}
    </span>
  );
}
