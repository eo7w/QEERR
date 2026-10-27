import { ArrowDown, ArrowUp } from 'lucide-react'
import { PairIcon } from './pair-icon'
import { StatusBadge } from './status-badge'
import { getSymbol } from '@/lib/symbols'
import { countdown, dateTime, money, price } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Trade } from '@/lib/types'

export function TradeRow({ trade, now, showClient }: { trade: Trade; now: number; showClient?: boolean }) {
  const def = getSymbol(trade.symbol)
  if (!def) return null
  const left = (new Date(trade.expiresAt).getTime() - now) / 1000
  const up = trade.direction === 'up'
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
      <PairIcon symbol={def} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold" dir="ltr">
            {def.label}
          </span>
          {trade.otc && <span className="rounded bg-warn/15 px-1 text-[10px] font-bold text-warn">OTC</span>}
          <span
            className={cn(
              'rounded px-1 text-[10px] font-bold uppercase',
              trade.account === 'real' ? 'bg-up/15 text-up' : 'bg-white/10 text-muted',
            )}
          >
            {trade.account}
          </span>
          {showClient && <span className="text-[11px] text-muted">عميل #{trade.displayId}</span>}
        </div>
        <p className="mt-0.5 text-[11px] text-muted tabular-nums" dir="ltr">
          {price(trade.openPrice, def.digits)}
          {trade.closePrice != null && ` → ${price(trade.closePrice, def.digits)}`} · {dateTime(trade.openedAt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={cn('flex items-center gap-0.5 text-sm font-bold tabular-nums', up ? 'text-up' : 'text-down')} dir="ltr">
          {up ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {money(trade.amount)}
        </span>
        {trade.status === 'open' ? (
          <span className="text-[11px] font-semibold text-accent tabular-nums" dir="ltr">
            {countdown(left)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {trade.profit != null && trade.status !== 'tie' && (
              <span className={cn('text-[11px] font-semibold tabular-nums', trade.profit > 0 ? 'text-up' : 'text-down')} dir="ltr">
                {trade.profit > 0 ? '+' : ''}
                {money(trade.profit)}
              </span>
            )}
            <StatusBadge status={trade.status} />
          </span>
        )}
      </div>
    </li>
  )
}
