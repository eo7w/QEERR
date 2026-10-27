import { NextResponse } from 'next/server'
import { sql, mapTrade, mapTx, isUuid } from '@/lib/db'
import { isAdmin } from '@/lib/session'
import { settleExpired } from '@/lib/settle'

const unauthorized = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

export async function GET() {
  if (!(await isAdmin())) return unauthorized()
  await settleExpired()
  const [txs, trades, stats] = await Promise.all([
    sql`SELECT t.*, c.display_id FROM transactions t JOIN clients c ON c.id = t.client_id
        ORDER BY (t.status = 'pending') DESC, t.created_at DESC LIMIT 150`,
    sql`SELECT tr.*, c.display_id FROM trades tr JOIN clients c ON c.id = tr.client_id
        ORDER BY tr.opened_at DESC LIMIT 150`,
    sql`SELECT
        (SELECT count(*)::int FROM clients) AS clients,
        (SELECT count(*)::int FROM transactions WHERE status = 'pending') AS pending,
        (SELECT count(*)::int FROM trades WHERE status = 'open') AS open_trades,
        (SELECT coalesce(sum(amount), 0) FROM trades WHERE account = 'real' AND opened_at > now() - interval '1 day') AS volume`,
  ])
  const s = stats[0]
  return NextResponse.json({
    transactions: txs.map(mapTx),
    trades: trades.map(mapTrade),
    stats: { clients: s.clients, pending: s.pending, openTrades: s.open_trades, volume: Number(s.volume) },
  })
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized()
  const body = await req.json().catch(() => null)
  const id = body?.id
  const action = body?.action
  if (!isUuid(id) || (action !== 'approve' && action !== 'reject'))
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })

  const rows =
    action === 'approve'
      ? await sql`
          WITH t AS (UPDATE transactions SET status = 'approved', reviewed_at = now()
                     WHERE id = ${id} AND status = 'pending' RETURNING client_id, type, amount)
          UPDATE clients c SET real_balance = c.real_balance + CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END
          FROM t WHERE c.id = t.client_id RETURNING c.id`
      : await sql`
          WITH t AS (UPDATE transactions SET status = 'rejected', reviewed_at = now()
                     WHERE id = ${id} AND status = 'pending' RETURNING client_id, type, amount)
          UPDATE clients c SET real_balance = c.real_balance + CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END
          FROM t WHERE c.id = t.client_id RETURNING c.id`

  if (!rows.length) return NextResponse.json({ error: 'تمت مراجعة هذا الطلب مسبقًا' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
