'use client'

import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import type { Account } from '@/lib/types'

export function TopBar({
  account,
  onAccount,
  balance,
  onDeposit,
}: {
  account: Account
  onAccount: (a: Account) => void
  balance: number | undefined
  onDeposit: () => void
}) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5">
      <div className="flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold" role="tablist" aria-label="نوع الحساب">
        {(['real', 'demo'] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={account === a}
            onClick={() => onAccount(a)}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              account === a ? (a === 'real' ? 'bg-up text-white' : 'bg-white text-black') : 'text-muted',
            )}
          >
            {a === 'real' ? 'Real' : 'Demo'}
          </button>
        ))}
      </div>
      <div className="text-center leading-tight">
        <p className="text-[10px] text-muted">{account === 'real' ? 'الرصيد الحقيقي' : 'الرصيد التجريبي'}</p>
        <p className="text-sm font-bold tabular-nums" dir="ltr">
          {balance === undefined ? '...' : money(balance)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDeposit}
        className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black active:scale-95"
      >
        إيداع
      </button>
    </header>
  )
}
