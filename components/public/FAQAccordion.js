'use client'

import { useState } from 'react'

export default function FAQAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(0)
  if (!items.length) return null

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const panelId = `faq-panel-${index}`
        return (
          <div key={item.question} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-slate-900 transition-colors duration-150 hover:bg-slate-50"
            >
              <span>{item.question}</span>
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#0d7a8a] transition-transform duration-150 ${isOpen ? 'rotate-45' : ''}`} aria-hidden="true">
                +
              </span>
            </button>
            {isOpen && (
              <div id={panelId} className="border-t border-slate-100 px-4 pb-4 pt-3 text-sm leading-6 text-slate-600">
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
