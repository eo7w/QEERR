'use client'

import { ArrowDown, ArrowUp, Minus, Plus } from 'lucide-react'
import { countdown, money } from '@/lib/format'

export function TradeControls({
  amount,
  setAmount,
  duration,
  payout,
  busy,
  onAmount,
  onDuration,
  onTrade,
}: {
  amount: number
  setAmount: (n: number) => void
  duration: number
  payout: number
  busy: boolean
  onAmount: () => void
  onDuration: () => void
  onTrade: (d: 'up' | 'down') => void
}) {
  const step = amount >= 1000 ? 100 : amount >= 100 ? 10 : 1
  return (
    <div className="space-y-2.5 px-4 pt-2 pb-3">
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex h-12 items-center rounded-2xl bg-surface-2 px-1.5">
            <button
              type="button"
              aria-label="زيادة المبلغ"
              onClick={() => setAmount(Math.min(50000, amount + step))}
              className="flex size-9 items-center justify-center rounded-xl text-white hover:bg-white/5"
            >
              <Plus className="size-4" />
            </button>
            <button type="button" onClick={onAmount} className="flex-1 text-center font-bold tabular-nums" dir="ltr">
              {money(amount)}
            </button>
            <button
              type="button"
              aria-label="إنقاص المبلغ"
              onClick={() => setAmount(Math.max(1, amount - step))}
              className="flex size-9 items-center justify-center rounded-xl text-white hover:bg-white/5"
            >
              <Minus className="size-4" />
            </button>
          </div>
          <span className="text-center text-[10px] text-muted">المبلغ</span>
        </div>
        <div className="flex w-24 flex-col gap-1">
          <button
            type="button"
            onClick={onDuration}
            className="h-12 rounded-2xl bg-surface-2 font-bold tabular-nums"
            dir="ltr"
          >
            {countdown(duration)}
          </button>
          <span className="text-center text-[10px] text-muted">إغلاق تلقائي</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onTrade('up')}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-up text-base font-bold active:scale-[0.98] disabled:opacity-60"
        >
          <ArrowUp className="size-4" />
          أعلى
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onTrade('down')}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-down text-base font-bold active:scale-[0.98] disabled:opacity-60"
        >
          <ArrowDown className="size-4" />
          أسفل
        </button>
      </div>
      <p className="text-center text-[11px] text-muted">
        اربح الصفقة واحصل على <span className="font-semibold text-accent">{payout}%</span> ربح ={' '}
        <span className="font-semibold text-white tabular-nums" dir="ltr">
          {money(amount + (amount * payout) / 100)}
        </span>
      </p>
    </div>
  )
}
