import { NextResponse } from 'next/server'
import { checkAdminCode, grantAdmin, isAdmin, revokeAdmin } from '@/lib/session'

export async function GET() {
  return NextResponse.json({ admin: await isAdmin() })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!checkAdminCode(body?.code)) {
    await new Promise((r) => setTimeout(r, 600))
    return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 401 })
  }
  await grantAdmin()
  return NextResponse.json({ admin: true })
}

export async function DELETE() {
  await revokeAdmin()
  return NextResponse.json({ admin: false })
}
