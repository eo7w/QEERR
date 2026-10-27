import { SYMBOLS, getSymbol } from './symbols'
import { otcPrice } from './otc'
import type { Quote } from './types'

type RawQuote = {
  bid: number
  ask: number
  mid?: number
  marketState?: string
  stale?: boolean
  quoteAgeSeconds?: number
  dayDiffPercent?: number
}

const BASE_URL = (() => {
  const raw = [process.env.BIQUOTE_BASE_URL, process.env.XAUUSD_SOURCE].filter(Boolean).join(' ')
  const match = raw.match(/https?:\/\/[^"'\s]+/)
  return (match?.[0] ?? 'https://biquote.io/api').replace(/\/$/, '')
})()

const CACHE_MS = 900
const LAST_GOOD_MS = 30_000
const cache = new Map<string, { at: number; raw: RawQuote | null }>()
const lastGood = new Map<string, { at: number; raw: RawQuote }>()
const inflight = new Map<string, Promise<RawQuote | null>>()

async function loadRaw(api: string): Promise<RawQuote | null> {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(api)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as RawQuote
    if (typeof data.bid !== 'number' || data.bid <= 0) return null
    lastGood.set(api, { at: Date.now(), raw: data })
    return data
  } catch {
    return null
  }
}

async function getRaw(api: string) {
  const hit = cache.get(api)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.raw
  let p = inflight.get(api)
  if (!p) {
    p = loadRaw(api).then((raw) => {
      cache.set(api, { at: Date.now(), raw })
      inflight.delete(api)
      return raw
    })
    inflight.set(api, p)
  }
  return p
}

const midOf = (r: RawQuote) => (r.mid && r.mid > 0 ? r.mid : (r.bid + r.ask) / 2)

export async function getQuote(symbol: string): Promise<Quote> {
  const def = getSymbol(symbol)
  if (!def) throw new Error('unknown symbol')
  const now = Date.now()
  const fresh = await getRaw(def.api)
  const good = lastGood.get(def.api)
  const raw = fresh ?? (good && now - good.at < LAST_GOOD_MS ? good.raw : null)
  const reference = raw ?? good?.raw ?? null
  const anchor = reference ? midOf(reference) : def.fallback

  const isLive =
    !!raw && raw.marketState === 'open' && raw.stale !== true && (raw.quoteAgeSeconds ?? 0) < 600

  if (isLive) {
    return { symbol, price: anchor, otc: false, anchor, changePct: raw.dayDiffPercent ?? 0, ts: now }
  }
  const p = otcPrice(symbol, anchor, now, def.vol)
  return { symbol, price: p, otc: true, anchor, changePct: (p / anchor - 1) * 100, ts: now }
}

export async function getAllQuotes() {
  const list = await Promise.all(SYMBOLS.map((s) => getQuote(s.id)))
  return Object.fromEntries(list.map((q) => [q.symbol, q]))
}
