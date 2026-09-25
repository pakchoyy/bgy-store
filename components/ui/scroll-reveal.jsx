import { useScrollReveal } from '@/lib/use-scroll-reveal'

export function ScrollReveal({ children, className = '', animation = 'fadeInUp', duration = 600, delay = 0, ...props }) {
  const ref = useScrollReveal({ duration, delay })

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }} {...props}>
      {children}
    </div>
  )
}
