export default function Testimonials({ reviews = [] }) {
  if (!reviews.length) return null
  return (
    <section aria-labelledby="testimonials-title" className="mt-5">
      <h2 id="testimonials-title" className="mb-2 inline-block rounded-full bg-[#123b35] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        Kata guru yang sudah beli
      </h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map((review) => (
          <figure key={review.id} className="w-64 shrink-0 snap-start rounded-2xl bg-white/95 p-4 shadow-sm">
            <p className="text-sm text-amber-400" aria-label={`Rating ${review.rating} dari 5`}>{'★'.repeat(review.rating)}<span className="text-gray-200">{'★'.repeat(5 - review.rating)}</span></p>
            <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-700">&ldquo;{review.comment}&rdquo;</blockquote>
            <figcaption className="mt-3 border-t border-gray-100 pt-2">
              <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
              {review.reviewer_institution && <p className="text-xs text-gray-500">{review.reviewer_institution}</p>}
              {review.product?.title && <p className="mt-0.5 line-clamp-1 text-xs text-emerald-700">{review.product.title}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
