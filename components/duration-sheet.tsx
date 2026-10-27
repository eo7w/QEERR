'use client'

import { Sheet } from './sheet'
import { DURATIONS, formatDuration } from '@/lib/symbols'
import { cn } from '@/lib/cn'

export function DurationSheet({
  open,
  onClose,
  value,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  value: number
  onSelect: (n: number) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="إغلاق تلقائي" subtitle="حدد الوقت الذي تُغلق فيه صفقتك تلقائيًا">
      <div className="grid grid-cols-3 gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              onSelect(d)
              onClose()
            }}
            className={cn(
              'h-12 rounded-2xl text-sm font-semibold',
              value === d ? 'bg-white text-black' : 'bg-surface-2 text-white',
            )}
          >
            {formatDuration(d)}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
