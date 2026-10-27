import { NextResponse } from 'next/server'
import { sql, mapTx } from '@/lib/db'
import { getClientId } from '@/lib/session'
import { PAYMENT_METHODS } from '@/lib/types'

export async function GET() {
  const id = await getClientId()
  const rows = await sql`SELECT * FROM transactions WHERE client_id = ${id} ORDER BY created_at DESC LIMIT 50`
  return NextResponse.json({ transactions: rows.map(mapTx) })
}

export async function POST(req: Request) {
  const id = await getClientId()
  const body = await req.json().catch(() => null)
  const type = body?.type
  const method = body?.method
  const amount = Math.round(Number(body?.amount) * 100) / 100
  const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 200) : ''

  if (type !== 'deposit' && type !== 'withdraw') return NextResponse.json({ error: 'نوع غير صالح' }, { status: 400 })
  if (!(PAYMENT_METHODS as readonly string[]).includes(method))
    return NextResponse.json({ error: 'طريقة دفع غير صالحة' }, { status: 400 })
  if (!Number.isFinite(amount) || amount < 10 || amount > 100000)
    return NextResponse.json({ error: 'المبلغ يجب أن يكون بين $10 و $100,000' }, { status: 400 })
  if (type === 'withdraw' && details.length < 4)
    return NextResponse.json({ error: 'أدخل عنوان المحفظة أو بيانات الحساب' }, { status: 400 })

  const pending = await sql`SELECT count(*)::int AS n FROM transactions WHERE client_id = ${id} AND status = 'pending'`
  if (pending[0].n >= 5) return NextResponse.json({ error: 'لديك طلبات كثيرة قيد المراجعة' }, { status: 400 })

  const rows =
    type === 'deposit'
      ? await sql`INSERT INTO transactions (client_id, type, amount, method, details)
          VALUES (${id}, 'deposit', ${amount}, ${method}, ${details || null}) RETURNING *`
      : await sql`
          WITH upd AS (UPDATE clients SET real_balance = real_balance - ${amount} WHERE id = ${id} AND real_balance >= ${amount} RETURNING id)
          INSERT INTO transactions (client_id, type, amount, method, details)
          SELECT id, 'withdraw', ${amount}, ${method}, ${details} FROM upd RETURNING *`

  if (!rows.length) return NextResponse.json({ error: 'رصيد الحساب الحقيقي غير كافٍ للسحب' }, { status: 400 })
  return NextResponse.json({ transaction: mapTx(rows[0]) })
}
