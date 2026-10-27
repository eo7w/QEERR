'use client'

import { Delete } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from './sheet'

export function AmountSheet({
  open,
  onClose,
  value,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  value: number
  onConfirm: (n: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? String(value)
  const close = () => {
    setDraft(null)
    onClose()
  }
  const press = (k: string) => {
    const base = draft ?? ''
    if (k === 'del') return setDraft(base.slice(0, -1))
    if (base.length >= 5) return
    setDraft(base === '0' ? k : base + k)
  }
  const n = Number(shown || 0)

  return (
    <Sheet open={open} onClose={close}>
      <div className="mb-4 text-center">
        <p className="text-4xl font-bold tabular-nums" dir="ltr">
          ${shown || '0'}
        </p>
        <p className="mt-1 text-xs text-muted">أدخل قيمة الصفقة</p>
      </div>
      <button
        type="button"
        disabled={n < 1 || n > 50000}
        onClick={() => {
          onConfirm(n)
          close()
        }}
        className="mb-3 h-12 w-full rounded-full bg-white font-bold text-black disabled:opacity-40"
      >
        تأكيد
      </button>
      <div className="grid grid-cols-3 gap-2" dir="ltr">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'حذف' : k}
              className="flex h-12 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold active:bg-white/10"
            >
              {k === 'del' ? <Delete className="size-5" /> : k}
            </button>
          ),
        )}
      </div>
    </Sheet>
  )
}
