'use client'

export default function FAQEditor({ faqs = [], onChange }) {
  const addFaq = () => {
    onChange([...faqs, { id: Date.now().toString(), question: '', answer: '' }])
  }

  const removeFaq = (id) => {
    onChange(faqs.filter(f => f.id !== id))
  }

  const updateFaq = (id, field, value) => {
    onChange(faqs.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  return (
    <div className="space-y-3">
      {faqs.length === 0 && (
        <p className="text-sm text-gray-400 italic">Belum ada FAQ. Klik tombol di bawah untuk menambah.</p>
      )}
      {faqs.map((faq, index) => (
        <div key={faq.id} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 cursor-grab select-none text-lg">⠿</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FAQ #{index + 1}</span>
            </div>
            <button
              type="button"
              onClick={() => removeFaq(faq.id)}
              className="text-red-500 hover:text-red-700 text-xs font-semibold transition-colors"
            >
              Hapus
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
              <input
                type="text"
                value={faq.question}
                onChange={e => updateFaq(faq.id, 'question', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
                placeholder="Tulis pertanyaan..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban</label>
              <textarea
                value={faq.answer}
                onChange={e => updateFaq(faq.id, 'answer', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[#0ea5a0]/20 focus:border-[#0ea5a0] transition-all"
                placeholder="Tulis jawaban..."
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addFaq}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#0ea5a0] hover:text-[#0d7a8a] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah FAQ
      </button>
    </div>
  )
}
