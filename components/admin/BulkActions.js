'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function BulkActions({ selectedIds, actions = [] }) {
  if (selectedIds.length === 0) return null

  return (
    <Alert className="bg-teal-50 border-teal-200">
      <AlertDescription className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">
          {selectedIds.length} terpilih
        </span>
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.danger ? 'destructive' : 'outline'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}
