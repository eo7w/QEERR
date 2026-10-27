import { NextResponse } from 'next/server'
import { sql, mapTrade } from '@/lib/db'
import { getClientId } from '@/lib/session'
import { settleExpired } from '@/lib/settle'
import { getQuote } from '@/lib/quotes'
import { DURATIONS, getSymbol } from '@/lib/symbols'

export async function GET() {
  const id = await getClientId()
  await settleExpired(id)
  const rows = await sql`SELECT * FROM trades WHERE client_id = ${id} ORDER BY opened_at DESC LIMIT 60`
  return NextResponse.json({ trades: rows.map(mapTrade) })
}

export async function POST(req: Request) {
  const id = await getClientId()
  const body = await req.json().catch(() => null)
  const def = getSymbol(body?.symbol)
  const direction = body?.direction
  const account = body?.account
  const duration = Number(body?.duration)
  const amount = Math.round(Number(body?.amount) * 100) / 100

  if (!def) return NextResponse.json({ error: 'زوج غير معروف' }, { status: 400 })
  if (direction !== 'up' && direction !== 'down') return NextResponse.json({ error: 'اتجاه غير صالح' }, { status: 400 })
  if (account !== 'real' && account !== 'demo') return NextResponse.json({ error: 'حساب غير صالح' }, { status: 400 })
  if (!(DURATIONS as readonly number[]).includes(duration))
    return NextResponse.json({ error: 'مدة غير صالحة' }, { status: 400 })
  if (!Number.isFinite(amount) || amount < 1 || amount > 50000)
    return NextResponse.json({ error: 'المبلغ يجب أن يكون بين $1 و $50,000' }, { status: 400 })

  const openCount = await sql`SELECT count(*)::int AS n FROM trades WHERE client_id = ${id} AND status = 'open'`
  if (openCount[0].n >= 20) return NextResponse.json({ error: 'وصلت للحد الأقصى من الصفقات المفتوحة' }, { status: 400 })

  const quote = await getQuote(def.id)
  const rows =
    account === 'real'
      ? await sql`
          WITH upd AS (UPDATE clients SET real_balance = real_balance - ${amount} WHERE id = ${id} AND real_balance >= ${amount} RETURNING id)
          INSERT INTO trades (client_id, symbol, direction, account, amount, payout_pct, open_price, otc, expires_at)
          SELECT id, ${def.id}, ${direction}, 'real', ${amount}, ${def.payout}, ${quote.price}, ${quote.otc}, now() + ${duration}::int * interval '1 second'
          FROM upd RETURNING *`
      : await sql`
          WITH upd AS (UPDATE clients SET demo_balance = demo_balance - ${amount} WHERE id = ${id} AND demo_balance >= ${amount} RETURNING id)
          INSERT INTO trades (client_id, symbol, direction, account, amount, payout_pct, open_price, otc, expires_at)
          SELECT id, ${def.id}, ${direction}, 'demo', ${amount}, ${def.payout}, ${quote.price}, ${quote.otc}, now() + ${duration}::int * interval '1 second'
          FROM upd RETURNING *`

  if (!rows.length) return NextResponse.json({ error: 'رصيد غير كافٍ', code: 'insufficient' }, { status: 400 })
  return NextResponse.json({ trade: mapTrade(rows[0]) })
}
