import { sql } from './db'
import { getQuote } from './quotes'
import { otcPrice } from './otc'
import { getSymbol } from './symbols'

export async function settleExpired(clientId?: string) {
  const rows = clientId
    ? await sql`SELECT * FROM trades WHERE status = 'open' AND expires_at <= now() AND client_id = ${clientId} LIMIT 50`
    : await sql`SELECT * FROM trades WHERE status = 'open' AND expires_at <= now() LIMIT 100`

  for (const t of rows) {
    const def = getSymbol(t.symbol)
    if (!def) continue
    const quote = await getQuote(t.symbol)
    const closePrice = t.otc
      ? otcPrice(t.symbol, quote.anchor, new Date(t.expires_at).getTime(), def.vol)
      : quote.price
    const openPrice = Number(t.open_price)
    const amount = Number(t.amount)
    const diff = closePrice - openPrice
    const status =
      Math.abs(diff) < openPrice * 1e-9 ? 'tie' : (diff > 0) === (t.direction === 'up') ? 'won' : 'lost'
    const profit =
      status === 'won' ? Math.round(amount * Number(t.payout_pct)) / 100 : status === 'lost' ? -amount : 0
    const credit = status === 'won' ? amount + profit : status === 'tie' ? amount : 0

    await sql`
      WITH t AS (
        UPDATE trades SET status = ${status}, close_price = ${closePrice}, profit = ${profit}
        WHERE id = ${t.id} AND status = 'open'
        RETURNING client_id, account
      )
      UPDATE clients SET
        real_balance = real_balance + CASE WHEN t.account = 'real' THEN ${credit}::numeric ELSE 0 END,
        demo_balance = demo_balance + CASE WHEN t.account = 'demo' THEN ${credit}::numeric ELSE 0 END
      FROM t WHERE clients.id = t.client_id`
  }
}
