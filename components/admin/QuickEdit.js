'use client'

import { useState, useRef, useEffect } from 'react'

export default function QuickEdit({ value, field, onSave, onCancel }) {
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      onSave(field, editValue)
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border border-[#0ea5a0] rounded-md px-2 py-1 text-sm outline-none ring-1 ring-[#0ea5a0]/30 bg-white"
      />
      <button
        type="button"
        onClick={handleSave}
        className="p-1 text-[#0ea5a0] hover:text-[#0d7a8a] transition-colors"
        title="Simpan"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Batal"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
