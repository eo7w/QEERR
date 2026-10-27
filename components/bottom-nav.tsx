'use client'

import { CandlestickChart, History, ShieldCheck, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

export type Tab = 'trade' | 'trades' | 'wallet' | 'admin'

const ITEMS: Array<{ id: Tab; label: string; Icon: typeof Wallet }> = [
  { id: 'trade', label: 'التداول', Icon: CandlestickChart },
  { id: 'trades', label: 'صفقاتي', Icon: History },
  { id: 'wallet', label: 'المحفظة', Icon: Wallet },
  { id: 'admin', label: 'الموافقة', Icon: ShieldCheck },
]

export function BottomNav({ tab, onTab, openCount }: { tab: Tab; onTab: (t: Tab) => void; openCount: number }) {
  return (
    <nav className="grid grid-cols-4 border-t border-line bg-bg pt-1.5 pb-2" aria-label="التنقل الرئيسي">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          aria-current={tab === id ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium transition-colors',
            tab === id ? 'text-white' : 'text-muted',
          )}
        >
          <Icon className="size-5" strokeWidth={1.8} />
          {label}
          {id === 'trades' && openCount > 0 && (
            <span className="absolute top-0 left-1/2 ms-2 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
              {openCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
