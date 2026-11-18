'use client'

import { useEffect, useRef, useState } from 'react'
import { shortProductTitle } from '@/lib/pick-reviews.mjs'

const SPEED = 24 // piksel per detik: pelan, satu kartu sekitar 11 detik

function Card({ review }) {
  return (
    <figure className="w-64 shrink-0 rounded-2xl bg-white/95 p-4 shadow-sm">
      <p className="text-sm text-amber-400" aria-label={`Rating ${review.rating} dari 5`}>{'★'.repeat(review.rating)}<span className="text-gray-200">{'★'.repeat(5 - review.rating)}</span></p>
      <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-700">&ldquo;{review.comment}&rdquo;</blockquote>
      <figcaption className="mt-3 border-t border-gray-100 pt-2">
        <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
        {review.reviewer_institution && <p className="text-xs text-gray-600">{review.reviewer_institution}</p>}
        {review.product?.title && <p className="mt-0.5 line-clamp-1 text-xs text-emerald-700">{shortProductTitle(review.product.title)}</p>}
      </figcaption>
    </figure>
  )
}

// Ulasan bergeser sendiri dari kanan ke kiri dengan pelan, berhenti saat disentuh atau digeser pembeli,
// dan lanjut lagi beberapa detik setelah dilepas. Tanpa gerakan bila HP diatur "kurangi gerakan".
export default function Testimonials({ reviews = [] }) {
  const trackRef = useRef(null)
  const [looping, setLooping] = useState(false)

  useEffect(() => {
    if (reviews.length < 3) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setLooping(true) // salinan kedua dipasang setelah halaman hidup agar geseran tidak putus
  }, [reviews.length])

  useEffect(() => {
    const el = trackRef.current
    if (!el || !looping) return undefined
    let raf = 0
    let last = 0
    let pos = el.scrollLeft
    let paused = false
    let visible = true
    let resume = 0

    const half = () => el.scrollWidth / 2
    const tick = (time) => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min(time - last, 64) : 16
      last = time
      if (paused || !visible || document.hidden) return
      pos += (SPEED * dt) / 1000
      if (pos >= half()) pos -= half()
      el.scrollLeft = pos
    }
    const hold = () => { paused = true; window.clearTimeout(resume) }
    const release = () => {
      window.clearTimeout(resume)
      resume = window.setTimeout(() => { pos = el.scrollLeft; paused = false }, 2500)
    }
    // Hanya mouse asli yang menahan saat disorot. Layar sentuh juga mengirim mouseenter tanpa mouseleave.
    const hoverIn = (e) => { if (e.pointerType === 'mouse') hold() }
    const hoverOut = (e) => { if (e.pointerType === 'mouse') release() }
    const onScroll = () => {
      if (!paused) return
      if (el.scrollLeft >= half()) el.scrollLeft -= half()
      pos = el.scrollLeft
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.1 })
    observer.observe(el)

    el.addEventListener('pointerdown', hold)
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)
    el.addEventListener('pointerenter', hoverIn)
    el.addEventListener('pointerleave', hoverOut)
    el.addEventListener('focusin', hold)
    el.addEventListener('focusout', release)
    el.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(resume)
      observer.disconnect()
      el.removeEventListener('pointerdown', hold)
      el.removeEventListener('pointerup', release)
      el.removeEventListener('pointercancel', release)
      el.removeEventListener('pointerenter', hoverIn)
      el.removeEventListener('pointerleave', hoverOut)
      el.removeEventListener('focusin', hold)
      el.removeEventListener('focusout', release)
      el.removeEventListener('scroll', onScroll)
    }
  }, [looping])

  if (!reviews.length) return null
  return (
    <section aria-labelledby="testimonials-title" className="my-1">
      <h2 id="testimonials-title" className="mb-2 inline-block rounded-full bg-[#123b35] px-3 py-1 text-xs font-bold text-white">
        Kata guru yang sudah beli
      </h2>
      <div ref={trackRef} className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ overscrollBehaviorX: 'contain' }}>
        {reviews.map((review) => <Card key={review.id} review={review} />)}
        {looping && reviews.map((review) => (
          <div key={`salinan-${review.id}`} aria-hidden="true" className="contents">
            <Card review={review} />
          </div>
        ))}
      </div>
    </section>
  )
}
