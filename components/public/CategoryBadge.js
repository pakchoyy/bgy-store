export default function CategoryBadge({ category }) {
  if (!category) return null;

  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
      }}
    >
      {category.name}
    </span>
  );
}
