'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-8 px-2 text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSave}
        className="h-8 w-8 p-0"
        title="Simpan"
      >
        ✓
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-8 w-8 p-0"
        title="Batal"
      >
        ✕
      </Button>
    </div>
  )
}
