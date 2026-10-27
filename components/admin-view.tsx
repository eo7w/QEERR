'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Check, Delete, LogOut, ShieldCheck, X } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { TradeRow } from './trade-row'
import { cn } from '@/lib/cn'
import { dateTime, fetcher, money, postJson } from '@/lib/format'
import type { Trade, Transaction } from '@/lib/types'

type AdminData = {
  transactions: Transaction[]
  trades: Trade[]
  stats: { clients: number; pending: number; openTrades: number; volume: number }
}

export function AdminView({ now, onChanged }: { now: number; onChanged: () => void }) {
  const { data: session, mutate: mutateSession } = useSWR<{ admin: boolean }>('/api/admin/session', fetcher)
  if (!session) return <div className="flex-1" />
  if (!session.admin) return <PinGate onSuccess={() => mutateSession({ admin: true })} />
  return (
    <Dashboard
      now={now}
      onChanged={onChanged}
      onLogout={async () => {
        await fetch('/api/admin/session', { method: 'DELETE' })
        mutateSession({ admin: false })
      }}
    />
  )
}

function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function press(k: string) {
    if (busy) return
    setError('')
    if (k === 'del') return setPin((p) => p.slice(0, -1))
    const next = (pin + k).slice(0, 4)
    setPin(next)
    if (next.length === 4) {
      setBusy(true)
      try {
        await postJson('/api/admin/session', { code: next })
        onSuccess()
      } catch (e) {
        setError((e as Error).message)
        setPin('')
      } finally {
        setBusy(false)
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <ShieldCheck className="size-7" />
      </span>
      <h1 className="text-xl font-bold">قسم الموافقة</h1>
      <p className="mt-1 mb-5 text-center text-xs text-muted">أدخل رمز الدخول المكوّن من 4 أرقام</p>
      <div className="mb-2 flex gap-3" dir="ltr" aria-label={`تم إدخال ${pin.length} من 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('size-3.5 rounded-full', i < pin.length ? 'bg-white' : 'bg-surface-2')} />
        ))}
      </div>
      <p className="mb-4 h-4 text-xs text-down" role="alert">{error}</p>
      <div className="grid w-full max-w-64 grid-cols-3 gap-2" dir="ltr">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'حذف' : k}
              className="flex h-12 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold active:bg-white/10"
            >
              {k === 'del' ? <Delete className="size-5" /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

function Dashboard({ now, onChanged, onLogout }: { now: number; onChanged: () => void; onLogout: () => void }) {
  const [tab, setTab] = useState<'requests' | 'trades'>('requests')
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data, mutate } = useSWR<AdminData>('/api/admin', fetcher, { refreshInterval: 2000 })

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    try {
      await postJson('/api/admin', { id, action })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusyId(null)
      mutate()
      onChanged()
    }
  }

  const txs = data?.transactions.filter((t) => filter === 'all' || t.status === 'pending') ?? []

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">قسم الموافقة</h1>
        <button type="button" onClick={onLogout} className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted hover:text-white">
          <LogOut className="size-3.5" />
          خروج
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { label: 'العملاء', value: data?.stats.clients },
          { label: 'بانتظار', value: data?.stats.pending, hl: true },
          { label: 'مفتوحة', value: data?.stats.openTrades },
          { label: 'حجم 24س', value: data ? `$${Math.round(data.stats.volume)}` : undefined },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface-2 p-2.5 text-center">
            <p className={cn('text-base font-bold tabular-nums', s.hl && s.value ? 'text-warn' : '')} dir="ltr">
              {s.value ?? '…'}
            </p>
            <p className="text-[10px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
        {(['requests', 'trades'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn('rounded-full py-2 text-sm font-semibold', tab === t ? 'bg-white text-black' : 'text-muted')}
          >
            {t === 'requests' ? 'الإيداع والسحب' : 'صفقات العملاء'}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <>
          <div className="mb-3 flex gap-2 text-xs">
            {(['pending', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn('rounded-full px-3 py-1 font-semibold', filter === f ? 'bg-accent text-white' : 'bg-surface-2 text-muted')}
              >
                {f === 'pending' ? 'بانتظار الموافقة' : 'الكل'}
              </button>
            ))}
          </div>
          {data && txs.length === 0 && (
            <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">لا توجد طلبات</p>
          )}
          <ul className="space-y-2">
            {txs.map((t) => (
              <li key={t.id} className="rounded-2xl bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className={t.type === 'deposit' ? 'text-up' : 'text-down'}>{t.type === 'deposit' ? 'إيداع' : 'سحب'}</span>
                      <span className="text-muted">·</span>
                      عميل #{t.displayId}
                    </p>
                    <p className="text-[11px] text-muted">
                      {t.method} · <span dir="ltr">{dateTime(t.createdAt)}</span>
                    </p>
                    {t.details && (
                      <p className="mt-1 truncate rounded-lg bg-black/30 px-2 py-1 text-[11px] text-muted" dir="ltr">
                        {t.details}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-base font-bold tabular-nums" dir="ltr">{money(t.amount)}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                {t.status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => review(t.id, 'approve')}
                      className="flex h-10 items-center justify-center gap-1 rounded-xl bg-up text-sm font-bold disabled:opacity-50"
                    >
                      <Check className="size-4" /> موافقة
                    </button>
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => review(t.id, 'reject')}
                      className="flex h-10 items-center justify-center gap-1 rounded-xl bg-down/90 text-sm font-bold disabled:opacity-50"
                    >
                      <X className="size-4" /> رفض
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {data && data.trades.length === 0 && (
            <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">لا توجد صفقات للعملاء بعد</p>
          )}
          <ul className="space-y-2">
            {data?.trades.map((t) => (
              <TradeRow key={t.id} trade={t} now={now} showClient />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
