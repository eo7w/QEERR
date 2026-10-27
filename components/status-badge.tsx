import { cn } from '@/lib/cn'

const MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'قيد المراجعة', cls: 'bg-warn/15 text-warn' },
  approved: { label: 'مقبول', cls: 'bg-up/15 text-up' },
  rejected: { label: 'مرفوض', cls: 'bg-down/15 text-down' },
  open: { label: 'مفتوحة', cls: 'bg-accent/15 text-accent' },
  won: { label: 'رابحة', cls: 'bg-up/15 text-up' },
  lost: { label: 'خاسرة', cls: 'bg-down/15 text-down' },
  tie: { label: 'تعادل', cls: 'bg-white/10 text-muted' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: 'bg-white/10 text-muted' }
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', s.cls)}>{s.label}</span>
}
