export type SymbolIcon =
  | { kind: 'pair'; base: string; quote: string }
  | { kind: 'brand'; slug: string; color: string; bg: string }

export type SymbolDef = {
  id: string
  api: string
  label: string
  name: string
  digits: number
  payout: number
  vol: number
  fallback: number
  icon: SymbolIcon
}

const pair = (base: string, quote: string): SymbolIcon => ({ kind: 'pair', base, quote })

export const SYMBOLS: SymbolDef[] = [
  { id: 'EURUSD', api: 'EURUSD', label: 'EUR / USD', name: 'اليورو / الدولار', digits: 5, payout: 85, vol: 1, fallback: 1.113, icon: pair('eu', 'us') },
  { id: 'USDJPY', api: 'USDJPY', label: 'USD / JPY', name: 'الدولار / الين', digits: 3, payout: 85, vol: 1, fallback: 157.9, icon: pair('us', 'jp') },
  { id: 'GBPUSD', api: 'GBPUSD', label: 'GBP / USD', name: 'الجنيه / الدولار', digits: 5, payout: 84, vol: 1.1, fallback: 1.33, icon: pair('gb', 'us') },
  { id: 'AUDUSD', api: 'AUDUSD', label: 'AUD / USD', name: 'الأسترالي / الدولار', digits: 5, payout: 82, vol: 1.1, fallback: 0.7025, icon: pair('au', 'us') },
  { id: 'USDCAD', api: 'USDCAD', label: 'USD / CAD', name: 'الدولار / الكندي', digits: 5, payout: 82, vol: 0.9, fallback: 1.4048, icon: pair('us', 'ca') },
  { id: 'USDCNY', api: 'USDCNY', label: 'USD / CNY', name: 'الدولار / اليوان', digits: 4, payout: 80, vol: 0.5, fallback: 6.65, icon: pair('us', 'cn') },
  { id: 'USDCHF', api: 'USDCHF', label: 'USD / CHF', name: 'الدولار / الفرنك', digits: 5, payout: 81, vol: 1, fallback: 0.8288, icon: pair('us', 'ch') },
  { id: 'USDHKD', api: 'USDHKD', label: 'USD / HKD', name: 'الدولار / هونغ كونغ', digits: 5, payout: 78, vol: 0.25, fallback: 7.841, icon: pair('us', 'hk') },
  { id: 'EURGBP', api: 'EURGBP', label: 'EUR / GBP', name: 'اليورو / الجنيه', digits: 5, payout: 80, vol: 0.8, fallback: 0.8365, icon: pair('eu', 'gb') },
  { id: 'USDKRW', api: 'USDKRW', label: 'USD / KRW', name: 'الدولار / الوون', digits: 2, payout: 78, vol: 1, fallback: 1326.8, icon: pair('us', 'kr') },
  { id: 'USTEC', api: 'USTEC', label: 'USTEC', name: 'ناسداك 100', digits: 2, payout: 83, vol: 2, fallback: 29685, icon: { kind: 'brand', slug: 'nasdaq', color: 'ffffff', bg: '#0996c7' } },
  { id: 'AAPL', api: 'AAPL', label: 'AAPL', name: 'أبل', digits: 2, payout: 82, vol: 2, fallback: 347, icon: { kind: 'brand', slug: 'apple', color: '000000', bg: '#ffffff' } },
  { id: 'BTCUSD', api: 'BTCUSD', label: 'BTC / USD', name: 'بيتكوين', digits: 2, payout: 86, vol: 3, fallback: 80800, icon: { kind: 'brand', slug: 'bitcoin', color: 'ffffff', bg: '#f7931a' } },
]

const BY_ID = new Map(SYMBOLS.map((s) => [s.id, s]))

export function getSymbol(id: string): SymbolDef | undefined {
  return BY_ID.get(id)
}

export const DURATIONS = [5, 10, 15, 20, 25, 30, 60, 120, 300] as const

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec} ثانية`
  return `${sec / 60} دقيقة`
}
