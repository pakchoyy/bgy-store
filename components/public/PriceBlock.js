export default function PriceBlock({ salePrice, originalPrice }) {
  if (salePrice === 0 || salePrice === null || salePrice === undefined) {
    return <span className="text-xl font-semibold text-brand">Gratis</span>;
  }

  const fmt = (val) => `Rp${Number(val).toLocaleString('id-ID')}`;

  if (originalPrice && originalPrice > salePrice) {
    const percent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    return (
      <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm line-through text-gray-500 font-semibold">
          {fmt(originalPrice)}
        </span>
                  <span className="text-xl font-semibold text-emerald-700">
          {fmt(salePrice)}
        </span>
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          Hemat {percent}%
        </span>
      </div>
    );
  }

  return (
                  <span className="text-xl font-semibold text-emerald-700">
      {fmt(salePrice)}
    </span>
  );
}
