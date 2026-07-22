export default function ProductBadge({ badge, badgeCustom }) {
  if (!badge) return null;

  const label = badge === 'custom' ? badgeCustom : badge;
  if (!label) return null;

  const colorMap = {
    terlaris: 'bg-amber-500',
    diskon: 'bg-red-500',
    baru: 'bg-blue-500',
    premium: 'bg-purple-500',
  };

  return (
    <span
      className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
        colorMap[badge] || 'bg-gray-500'
      }`}
    >
      {label}
    </span>
  );
}
