'use client';

import { useState } from 'react';

export default function ProductFAQ({ faqs }) {
  const [openId, setOpenId] = useState(null);

  if (!faqs || faqs.length === 0) return null;

  const sorted = [...faqs].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-2">
      {sorted.map((faq) => (
        <div key={faq.id} className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <span>{faq.question}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openId === faq.id && (
            <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
