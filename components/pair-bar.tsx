'use client'

import { ChevronDown, Clock } from 'lucide-react'
import { PairIcon } from './pair-icon'
import { cn } from '@/lib/cn'
import type { SymbolDef } from '@/lib/symbols'
import type { Quote } from '@/lib/types'

export function PairBar({
  symbol,
  quote,
  onOpenPicker,
  now,
}: {
  symbol: SymbolDef
  quote: Quote | undefined
  onOpenPicker: () => void
  now: number
}) {
  const change = quote?.changePct ?? 0
  return (
    <div className="flex items-center justify-between gap-2 px-4 pb-2">
      <button
        type="button"
        onClick={onOpenPicker}
        className="flex items-center gap-2.5 rounded-2xl bg-surface-2 py-1.5 ps-1.5 pe-3 active:scale-[0.98]"
        aria-label={`اختيار الزوج، الحالي ${symbol.label}`}
      >
        <PairIcon symbol={symbol} size={30} />
        <span className="text-start leading-tight">
          <span className="flex items-center gap-1.5 text-sm font-bold" dir="ltr">
            {symbol.label}
            {quote?.otc && <span className="rounded bg-warn/15 px-1 text-[10px] font-bold text-warn">OTC</span>}
          </span>
          <span
            className={cn('block text-[11px] font-medium tabular-nums', change >= 0 ? 'text-up' : 'text-down')}
            dir="ltr"
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)}% · {symbol.payout}%
          </span>
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            quote?.otc ? 'bg-warn/15 text-warn' : 'bg-up/15 text-up',
          )}
        >
          <span className={cn('size-1.5 rounded-full', quote?.otc ? 'bg-warn' : 'bg-up animate-pulse')} />
          {quote ? (quote.otc ? 'سوق OTC' : 'سوق مباشر') : '...'}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] tabular-nums text-muted" dir="ltr">
          <Clock className="size-3" />
          {new Date(now).toLocaleTimeString('en-GB')}
        </span>
      </div>
    </div>
  )
}
