'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

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
        <p className="text-sm text-slate-500 italic">Belum ada FAQ. Klik tombol di bawah untuk menambah.</p>
      )}
      {faqs.map((faq, index) => (
        <Card key={faq.id} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 cursor-grab select-none text-lg">⠿</span>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">FAQ #{index + 1}</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeFaq(faq.id)}
            >
              🗑️ Hapus
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pertanyaan</label>
              <Input
                type="text"
                value={faq.question}
                onChange={e => updateFaq(faq.id, 'question', e.target.value)}
                placeholder="Tulis pertanyaan..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jawaban</label>
              <Textarea
                value={faq.answer}
                onChange={e => updateFaq(faq.id, 'answer', e.target.value)}
                rows={3}
                placeholder="Tulis jawaban..."
              />
            </div>
          </div>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addFaq}
      >
        ➕ Tambah FAQ
      </Button>
    </div>
  )
}
