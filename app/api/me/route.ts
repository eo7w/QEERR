import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getClientId } from '@/lib/session'
import { settleExpired } from '@/lib/settle'

async function readMe(id: string) {
  const rows = await sql`SELECT display_id, real_balance, demo_balance FROM clients WHERE id = ${id}`
  const r = rows[0]
  return { displayId: Number(r.display_id), realBalance: Number(r.real_balance), demoBalance: Number(r.demo_balance) }
}

export async function GET() {
  const id = await getClientId()
  await settleExpired(id)
  return NextResponse.json(await readMe(id))
}

export async function POST(req: Request) {
  const id = await getClientId()
  const body = await req.json().catch(() => null)
  if (body?.action !== 'refill-demo') return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
  await sql`UPDATE clients SET demo_balance = 10000 WHERE id = ${id}`
  return NextResponse.json(await readMe(id))
}
