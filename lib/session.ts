import { cookies } from 'next/headers'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { sql, isUuid } from './db'

const CLIENT_COOKIE = 'qx_cid'
const ADMIN_COOKIE = 'qx_adm'
const ADMIN_CODE = process.env.ADMIN_CODE ?? '8637'
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
}

export async function getClientId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(CLIENT_COOKIE)?.value
  if (isUuid(existing)) {
    const rows = await sql`SELECT id FROM clients WHERE id = ${existing}`
    if (rows.length) return existing
  }
  const rows = await sql`INSERT INTO clients DEFAULT VALUES RETURNING id`
  const id = rows[0].id as string
  jar.set(CLIENT_COOKIE, id, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 })
  return id
}

const secret = () => createHash('sha256').update(`admin:${process.env.DATABASE_URL ?? ''}`).digest()
const sign = (value: string) => createHmac('sha256', secret()).update(value).digest('hex')

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function checkAdminCode(code: unknown) {
  return typeof code === 'string' && safeEqual(code, ADMIN_CODE)
}

export async function grantAdmin() {
  const exp = String(Date.now() + ADMIN_TTL_MS)
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, `${exp}.${sign(exp)}`, { ...cookieOptions, maxAge: ADMIN_TTL_MS / 1000 })
}

export async function revokeAdmin() {
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 })
}

export async function isAdmin() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE)?.value
  if (!token) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  return safeEqual(sig, sign(exp))
}
