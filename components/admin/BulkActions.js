'use client'

export default function BulkActions({ selectedIds, actions = [] }) {
  if (selectedIds.length === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0ea5a0]/5 border border-[#0ea5a0]/20 rounded-lg">
      <span className="text-sm font-medium text-gray-700">
        {selectedIds.length} terpilih
      </span>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            action.danger
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
