import { useEffect, useRef } from 'react'

export function useScrollReveal(options = {}) {
  const ref = useRef(null)
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    duration = 600,
    delay = 0,
  } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      element.style.opacity = '1'
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.addEventListener('animationend', () => {
          element.style.animation = ''
          element.style.opacity = '1'
        }, { once: true })
        element.style.animation = `fadeInUp ${duration}ms ease-out ${delay}ms forwards`
        observer.unobserve(element)
      }
    }, { threshold, rootMargin })

    // Add animation keyframes if not exists
    if (!document.getElementById('scroll-reveal-styles')) {
      const style = document.createElement('style')
      style.id = 'scroll-reveal-styles'
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `
      document.head.appendChild(style)
    }

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, duration, delay])

  return ref
}
