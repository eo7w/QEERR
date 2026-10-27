'use client'

import useSWR from 'swr'
import { useEffect, useRef, useState } from 'react'
import { TopBar } from './top-bar'
import { PairBar } from './pair-bar'
import { PriceChart } from './price-chart'
import { TradeControls } from './trade-controls'
import { BottomNav, type Tab } from './bottom-nav'
import { PairPicker } from './pair-picker'
import { AmountSheet } from './amount-sheet'
import { DurationSheet } from './duration-sheet'
import { TradesView } from './trades-view'
import { WalletView } from './wallet-view'
import { AdminView } from './admin-view'
import { getSymbol, SYMBOLS } from '@/lib/symbols'
import { fetcher, money, postJson } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Account, Me, QuotesResponse, Trade } from '@/lib/types'

type Toast = { kind: 'up' | 'down' | 'info'; text: string }

export function TradingApp() {
  const [tab, setTab] = useState<Tab>('trade')
  const [walletType, setWalletType] = useState<'deposit' | 'withdraw'>('deposit')
  const [account, setAccount] = useState<Account>('demo')
  const [symbolId, setSymbolId] = useState('EURUSD')
  const [amount, setAmount] = useState(10)
  const [duration, setDuration] = useState(5)
  const [sheet, setSheet] = useState<null | 'pairs' | 'amount' | 'duration'>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const offsetRef = useRef(0)
  const seenStatus = useRef(new Map<string, string>())

  const { data: quotes } = useSWR<QuotesResponse>('/api/quotes', fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 500,
    onSuccess: (d) => {
      offsetRef.current = d.serverTime - Date.now()
    },
  })
  const { data: me, mutate: mutateMe } = useSWR<Me>('/api/me', fetcher)
  const { data: tradesData, mutate: mutateTrades } = useSWR<{ trades: Trade[] }>('/api/trades', fetcher, {
    refreshInterval: (d) => (d?.trades.some((t) => t.status === 'open') ? 1500 : 0),
  })
  const trades = tradesData?.trades
  const openTrades = trades?.filter((t) => t.status === 'open') ?? []

  const symbol = getSymbol(symbolId) ?? SYMBOLS[0]
  const quote = quotes?.quotes[symbol.id]
  const balance = me ? (account === 'real' ? me.realBalance : me.demoBalance) : undefined

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() + offsetRef.current), 500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!trades) return
    const seen = seenStatus.current
    const firstLoad = seen.size === 0
    let settled: Trade | null = null
    for (const t of trades) {
      const prev = seen.get(t.id)
      if (!firstLoad && prev === 'open' && t.status !== 'open') settled = t
      seen.set(t.id, t.status)
    }
    if (settled) {
      mutateMe()
      const t = settled
      setToast(
        t.status === 'won'
          ? { kind: 'up', text: `ربحت ${money(t.profit ?? 0)}` }
          : t.status === 'lost'
            ? { kind: 'down', text: `خسرت ${money(t.amount)}` }
            : { kind: 'info', text: 'تعادل — تم استرداد المبلغ' },
      )
    }
  }, [trades, mutateMe])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(id)
  }, [toast])

  async function placeTrade(direction: 'up' | 'down') {
    setBusy(true)
    try {
      await postJson('/api/trades', { symbol: symbol.id, direction, amount, duration, account })
      await Promise.all([mutateTrades(), mutateMe()])
    } catch (e) {
      const msg = (e as Error).message
      setToast({ kind: 'down', text: msg })
      if (account === 'real' && msg.includes('رصيد')) openWallet('deposit')
    } finally {
      setBusy(false)
    }
  }

  function openWallet(type: 'deposit' | 'withdraw') {
    setWalletType(type)
    setTab('wallet')
  }

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-bg">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <TopBar account={account} onAccount={setAccount} balance={balance} onDeposit={() => openWallet('deposit')} />

        {tab === 'trade' && (
          <>
            <PairBar symbol={symbol} quote={quote} onOpenPicker={() => setSheet('pairs')} now={now} />
            <PriceChart
              symbol={symbol}
              quote={quote}
              serverOffset={offsetRef.current}
              trades={openTrades}
              duration={duration}
            />
            <TradeControls
              amount={amount}
              setAmount={setAmount}
              duration={duration}
              payout={symbol.payout}
              busy={busy || !quote}
              onAmount={() => setSheet('amount')}
              onDuration={() => setSheet('duration')}
              onTrade={placeTrade}
            />
          </>
        )}
        {tab === 'trades' && <TradesView trades={trades} now={now} />}
        {tab === 'wallet' && (
          <WalletView key={walletType} me={me} initialType={walletType} onChanged={() => mutateMe()} />
        )}
        {tab === 'admin' && <AdminView now={now} onChanged={() => mutateMe()} />}

        {toast && (
          <div
            role="status"
            className={cn(
              'pointer-events-none absolute inset-x-4 top-16 z-50 rounded-2xl px-4 py-3 text-center text-sm font-bold shadow-lg',
              toast.kind === 'up' ? 'bg-up' : toast.kind === 'down' ? 'bg-down' : 'bg-surface-2',
            )}
          >
            {toast.text}
          </div>
        )}

        <PairPicker
          open={sheet === 'pairs'}
          onClose={() => setSheet(null)}
          quotes={quotes?.quotes}
          current={symbol.id}
          onSelect={setSymbolId}
        />
        <AmountSheet open={sheet === 'amount'} onClose={() => setSheet(null)} value={amount} onConfirm={setAmount} />
        <DurationSheet open={sheet === 'duration'} onClose={() => setSheet(null)} value={duration} onSelect={setDuration} />
      </div>
      <BottomNav tab={tab} onTab={setTab} openCount={openTrades.length} />
    </main>
  )
}
