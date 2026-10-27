'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, RotateCcw } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { cn } from '@/lib/cn'
import { dateTime, fetcher, money, postJson } from '@/lib/format'
import { PAYMENT_METHODS, type Me, type Transaction } from '@/lib/types'

export function WalletView({
  me,
  initialType,
  onChanged,
}: {
  me: Me | undefined
  initialType: 'deposit' | 'withdraw'
  onChanged: () => void
}) {
  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState('100')
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const { data, mutate } = useSWR<{ transactions: Transaction[] }>('/api/transactions', fetcher, {
    refreshInterval: (d) => (d?.transactions.some((t) => t.status === 'pending') ? 4000 : 0),
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await postJson('/api/transactions', { type, amount: Number(amount), method, details })
      setMsg({ ok: true, text: type === 'deposit' ? 'تم إرسال طلب الإيداع وهو بانتظار الموافقة' : 'تم إرسال طلب السحب وهو بانتظار الموافقة' })
      setDetails('')
      mutate()
      onChanged()
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function refillDemo() {
    await postJson('/api/me', { action: 'refill-demo' })
    onChanged()
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
      <h1 className="mb-4 text-xl font-bold">المحفظة</h1>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-[11px] text-muted">الحساب الحقيقي</p>
          <p className="mt-1 text-lg font-bold tabular-nums" dir="ltr">
            {me ? money(me.realBalance) : '...'}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted">التجريبي</p>
            <button type="button" onClick={refillDemo} aria-label="إعادة تعبئة الحساب التجريبي" className="text-muted hover:text-white">
              <RotateCcw className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums" dir="ltr">
            {me ? money(me.demoBalance) : '...'}
          </p>
        </div>
      </div>
      {me && <p className="mb-3 text-[11px] text-muted">رقم حسابك: #{me.displayId}</p>}

      <form onSubmit={submit} className="mb-6 space-y-3 rounded-3xl bg-surface p-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
          {(['deposit', 'withdraw'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold',
                type === t ? 'bg-white text-black' : 'text-muted',
              )}
            >
              {t === 'deposit' ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
              {t === 'deposit' ? 'إيداع' : 'سحب'}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">المبلغ (USD)</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            className="h-11 w-full rounded-xl bg-surface-2 px-3 text-start font-semibold tabular-nums outline-none focus:ring-2 focus:ring-accent"
            dir="ltr"
            required
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[50, 100, 250, 500, 1000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted hover:text-white"
            >
              ${v}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">طريقة الدفع</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-11 w-full rounded-xl bg-surface-2 px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">
            {type === 'deposit' ? 'رقم العملية / مرجع التحويل (اختياري)' : 'عنوان المحفظة أو رقم الحساب'}
          </span>
          <input
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={200}
            required={type === 'withdraw'}
            className="h-11 w-full rounded-xl bg-surface-2 px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
            dir="ltr"
          />
        </label>
        {msg && (
          <p role="status" className={cn('rounded-xl px-3 py-2 text-xs', msg.ok ? 'bg-up/15 text-up' : 'bg-down/15 text-down')}>
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-white font-bold text-black disabled:opacity-50">
          {busy ? 'جارٍ الإرسال...' : type === 'deposit' ? 'إرسال طلب الإيداع' : 'إرسال طلب السحب'}
        </button>
        <p className="text-center text-[11px] text-muted">تتم مراجعة الطلبات والموافقة عليها من قسم الموافقة</p>
      </form>

      <h2 className="mb-2 text-sm font-semibold">طلباتي</h2>
      {data && data.transactions.length === 0 && (
        <p className="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">لا توجد طلبات بعد</p>
      )}
      <ul className="space-y-2">
        {data?.transactions.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-2 p-3">
            <div>
              <p className="text-sm font-semibold">{t.type === 'deposit' ? 'إيداع' : 'سحب'} · {t.method}</p>
              <p className="text-[11px] text-muted" dir="ltr">{dateTime(t.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums" dir="ltr">{money(t.amount)}</span>
              <StatusBadge status={t.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
