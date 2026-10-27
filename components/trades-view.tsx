'use client'

import { TradeRow } from './trade-row'
import { money } from '@/lib/format'
import type { Trade } from '@/lib/types'

export function TradesView({ trades, now }: { trades: Trade[] | undefined; now: number }) {
  const open = trades?.filter((t) => t.status === 'open') ?? []
  const closed = trades?.filter((t) => t.status !== 'open') ?? []
  const net = closed.reduce((s, t) => s + (t.profit ?? 0), 0)
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
      <h1 className="mb-1 text-xl font-bold">صفقاتي</h1>
      <p className="mb-4 text-xs text-muted">
        صافي النتائج:{' '}
        <span className={net >= 0 ? 'text-up' : 'text-down'} dir="ltr">
          {money(net)}
        </span>
      </p>
      {!trades && <p className="text-sm text-muted">جارٍ التحميل...</p>}
      {open.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">مفتوحة</h2>
          <ul className="space-y-2">
            {open.map((t) => (
              <TradeRow key={t.id} trade={t} now={now} />
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-semibold">السجل</h2>
        {trades && closed.length === 0 ? (
          <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">لا توجد صفقات مغلقة بعد</p>
        ) : (
          <ul className="space-y-2">
            {closed.map((t) => (
              <TradeRow key={t.id} trade={t} now={now} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
