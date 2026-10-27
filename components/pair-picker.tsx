'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from './sheet'
import { PairIcon } from './pair-icon'
import { SYMBOLS } from '@/lib/symbols'
import { price } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Quote } from '@/lib/types'

export function PairPicker({
  open,
  onClose,
  quotes,
  current,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  quotes: Record<string, Quote> | undefined
  current: string
  onSelect: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = SYMBOLS.filter(
    (s) => !q || s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.name.includes(query.trim()),
  )

  return (
    <Sheet open={open} onClose={onClose} title="الأصول" subtitle="عملات، مؤشرات، أسهم وعملات رقمية">
      <label className="mb-3 flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5">
        <Search className="size-4 text-muted" />
        <span className="sr-only">بحث</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث في الأصول..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </label>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface-2">
        {list.map((s) => {
          const quote = quotes?.[s.id]
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(s.id)
                  onClose()
                }}
                className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-white/5', current === s.id && 'bg-white/5')}
              >
                <PairIcon symbol={s} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" dir="ltr">
                    <span className="truncate">{s.label}</span>
                    {quote?.otc && <span className="rounded bg-warn/15 px-1 text-[10px] font-bold text-warn">OTC</span>}
                  </span>
                  <span className="block text-[11px] text-muted">{s.name}</span>
                </span>
                <span className="text-end">
                  <span className="block text-sm font-semibold tabular-nums" dir="ltr">
                    {quote ? price(quote.price, s.digits) : '—'}
                  </span>
                  <span className="block text-[11px] font-semibold text-up">{s.payout}%</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
