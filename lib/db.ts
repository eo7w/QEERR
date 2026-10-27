import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapTrade(r: any) {
  return {
    id: r.id,
    displayId: r.display_id ? Number(r.display_id) : undefined,
    symbol: r.symbol,
    direction: r.direction,
    account: r.account,
    amount: Number(r.amount),
    payoutPct: Number(r.payout_pct),
    openPrice: Number(r.open_price),
    closePrice: r.close_price == null ? null : Number(r.close_price),
    otc: r.otc,
    status: r.status,
    profit: r.profit == null ? null : Number(r.profit),
    openedAt: new Date(r.opened_at).toISOString(),
    expiresAt: new Date(r.expires_at).toISOString(),
  }
}

export function mapTx(r: any) {
  return {
    id: r.id,
    displayId: r.display_id ? Number(r.display_id) : undefined,
    type: r.type,
    amount: Number(r.amount),
    method: r.method,
    details: r.details,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
  }
}
