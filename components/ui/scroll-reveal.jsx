'use client'

import { useScrollReveal } from '@/lib/use-scroll-reveal'

export function ScrollReveal({ children, className = '', duration = 600, delay = 0 }) {
  const ref = useScrollReveal({ duration, delay })

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
