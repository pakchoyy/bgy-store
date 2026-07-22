export default function PriceBlock({ salePrice, originalPrice }) {
  if (salePrice === 0 || salePrice === null || salePrice === undefined) {
    return <span className="text-sm font-semibold text-[#0ea5a0]">Gratis</span>;
  }

  const fmt = (val) => `Rp${Number(val).toLocaleString('id-ID')}`;

  if (originalPrice && originalPrice > salePrice) {
    const percent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs line-through text-gray-400">
          {fmt(originalPrice)}
        </span>
        <span className="text-sm font-bold text-red-500">
          {fmt(salePrice)}
        </span>
        <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          Hemat {percent}%
        </span>
      </div>
    );
  }

  return (
    <span className="text-sm font-bold text-gray-900">
      {fmt(salePrice)}
    </span>
  );
}
