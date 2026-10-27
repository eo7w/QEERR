'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-sheet relative max-h-[88%] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-2 pb-5 no-scrollbar">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        {title && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
