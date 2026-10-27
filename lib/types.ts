export type Account = 'real' | 'demo'

export type Quote = {
  symbol: string
  price: number
  otc: boolean
  anchor: number
  changePct: number
  ts: number
}

export type QuotesResponse = { serverTime: number; quotes: Record<string, Quote> }

export type Me = { displayId: number; realBalance: number; demoBalance: number }

export type Trade = {
  id: string
  displayId?: number
  symbol: string
  direction: 'up' | 'down'
  account: Account
  amount: number
  payoutPct: number
  openPrice: number
  closePrice: number | null
  otc: boolean
  status: 'open' | 'won' | 'lost' | 'tie'
  profit: number | null
  openedAt: string
  expiresAt: string
}

export type Transaction = {
  id: string
  displayId?: number
  type: 'deposit' | 'withdraw'
  amount: number
  method: string
  details: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt: string | null
}

export const PAYMENT_METHODS = ['USDT (TRC20)', 'بطاقة بنكية', 'تحويل بنكي', 'محفظة إلكترونية'] as const
