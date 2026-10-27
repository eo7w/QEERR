'use client'

import { useEffect, useRef } from 'react'
import { otcPrice } from '@/lib/otc'
import type { SymbolDef } from '@/lib/symbols'
import type { Quote, Trade } from '@/lib/types'

const CANDLE_MS = 5000
const HISTORY = 90
const RIGHT_PAD = 70

type Candle = { t: number; o: number; h: number; l: number; c: number }

export function PriceChart({
  symbol,
  quote,
  serverOffset,
  trades,
  duration,
  onPrice,
}: {
  symbol: SymbolDef
  quote: Quote | undefined
  serverOffset: number
  trades: Trade[]
  duration: number
  onPrice?: (p: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const candlesRef = useRef<Candle[]>([])
  const keyRef = useRef('')
  const latest = useRef({ quote, serverOffset, trades, duration, onPrice })
  latest.current = { quote, serverOffset, trades, duration, onPrice }

  useEffect(() => {
    candlesRef.current = []
    keyRef.current = ''
  }, [symbol.id])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      width = wrap.clientWidth
      height = wrap.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const priceAt = (q: Quote, t: number) => (q.otc ? otcPrice(symbol.id, q.anchor, t, symbol.vol) : q.price)

    const backfill = (q: Quote, now: number) => {
      const out: Candle[] = []
      const shape = (t: number) => otcPrice(symbol.id, 1, t, symbol.vol)
      const ratio = q.otc ? 1 : q.price / shape(now)
      const start = Math.floor(now / CANDLE_MS) * CANDLE_MS - HISTORY * CANDLE_MS
      for (let ct = start; ct <= now; ct += CANDLE_MS) {
        let o = 0, h = -Infinity, l = Infinity, c = 0
        for (let s = 0; s < CANDLE_MS && ct + s <= now; s += 500) {
          const p = q.otc ? otcPrice(symbol.id, q.anchor, ct + s, symbol.vol) : shape(ct + s) * ratio
          if (s === 0) o = p
          h = Math.max(h, p)
          l = Math.min(l, p)
          c = p
        }
        out.push({ t: ct, o, h, l, c })
      }
      return out
    }

    const tick = () => {
      const { quote: q, serverOffset: off, trades: tr, duration: dur, onPrice: cb } = latest.current
      if (!width || !height) return
      ctx.clearRect(0, 0, width, height)
      if (!q) return
      const now = Date.now() + off
      const key = `${symbol.id}:${q.otc}`
      if (keyRef.current !== key) {
        candlesRef.current = backfill(q, now)
        keyRef.current = key
      }
      const p = priceAt(q, now)
      cb?.(p)
      const candles = candlesRef.current
      const bucket = Math.floor(now / CANDLE_MS) * CANDLE_MS
      const last = candles[candles.length - 1]
      if (!last || last.t < bucket) {
        candles.push({ t: bucket, o: last?.c ?? p, h: Math.max(p, last?.c ?? p), l: Math.min(p, last?.c ?? p), c: p })
        if (candles.length > HISTORY + 20) candles.shift()
      } else {
        last.c = p
        last.h = Math.max(last.h, p)
        last.l = Math.min(last.l, p)
      }

      const chartBottom = height - 22
      const leftAxis = 62
      const plotW = width - leftAxis
      const slot = Math.max(4, (plotW - RIGHT_PAD) / Math.min(candles.length, 60))
      const visible = candles.slice(-Math.floor((plotW - RIGHT_PAD) / slot))
      const xOf = (t: number) => width - RIGHT_PAD - ((bucket - t) / CANDLE_MS) * slot - slot / 2

      const symbolTrades = tr.filter((t) => t.symbol === symbol.id && t.status === 'open')
      let min = Infinity, max = -Infinity
      for (const c of visible) {
        min = Math.min(min, c.l)
        max = Math.max(max, c.h)
      }
      for (const t of symbolTrades) {
        min = Math.min(min, t.openPrice)
        max = Math.max(max, t.openPrice)
      }
      const pad = (max - min) * 0.18 || p * 0.0002
      min -= pad
      max += pad
      const yOf = (v: number) => 12 + ((max - v) / (max - min)) * (chartBottom - 24)

      ctx.font = '10px ui-sans-serif, system-ui'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.fillStyle = '#6b6b74'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const v = min + ((max - min) * i) / 5
        const y = yOf(v)
        ctx.beginPath()
        ctx.moveTo(leftAxis, y)
        ctx.lineTo(width, y)
        ctx.stroke()
        ctx.textAlign = 'left'
        ctx.fillText(v.toFixed(symbol.digits), 4, y)
      }
      ctx.textAlign = 'center'
      for (const c of visible) {
        if (c.t % 60000 === 0) {
          const x = xOf(c.t)
          ctx.fillText(new Date(c.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), x, height - 10)
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, chartBottom)
          ctx.stroke()
        }
      }

      const bodyW = Math.max(2, slot * 0.62)
      for (const c of visible) {
        const x = xOf(c.t)
        if (x < leftAxis) continue
        const up = c.c >= c.o
        ctx.strokeStyle = ctx.fillStyle = up ? '#1fb35b' : '#e5453b'
        ctx.beginPath()
        ctx.moveTo(x, yOf(c.h))
        ctx.lineTo(x, yOf(c.l))
        ctx.stroke()
        const y1 = yOf(Math.max(c.o, c.c))
        const y2 = yOf(Math.min(c.o, c.c))
        ctx.fillRect(x - bodyW / 2, y1, bodyW, Math.max(1, y2 - y1))
      }

      const expiryX = width - RIGHT_PAD + (dur * 1000 * slot) / CANDLE_MS - slot / 2
      if (expiryX < width) {
        ctx.strokeStyle = 'rgba(245,158,11,0.75)'
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(expiryX, 0)
        ctx.lineTo(expiryX, chartBottom)
        ctx.stroke()
      }

      for (const t of symbolTrades) {
        const y = yOf(t.openPrice)
        const color = t.direction === 'up' ? '#1fb35b' : '#e5453b'
        const left = Math.max(0, (new Date(t.expiresAt).getTime() - now) / 1000)
        ctx.strokeStyle = color
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(leftAxis, y)
        ctx.lineTo(width, y)
        ctx.stroke()
        ctx.setLineDash([])
        const label = `${t.direction === 'up' ? '▲' : '▼'} $${t.amount} · ${Math.ceil(left)}s`
        ctx.font = 'bold 10px ui-sans-serif, system-ui'
        const w = ctx.measureText(label).width + 12
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(leftAxis + 4, y - 9, w, 18, 9)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'left'
        ctx.fillText(label, leftAxis + 10, y)
      }

      const py = yOf(p)
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.moveTo(leftAxis, py)
      ctx.lineTo(width, py)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = 'bold 10px ui-sans-serif, system-ui'
      const txt = p.toFixed(symbol.digits)
      const tw = ctx.measureText(txt).width + 10
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.roundRect(2, py - 9, Math.max(tw, 56), 18, 5)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(txt, 7, py)
      const cx = xOf(bucket)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(cx, py, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    const id = window.setInterval(tick, 250)
    tick()
    return () => {
      window.clearInterval(id)
      ro.disconnect()
    }
  }, [symbol])

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1" dir="ltr">
      <canvas ref={canvasRef} className="absolute inset-0" role="img" aria-label={`رسم بياني لسعر ${symbol.label}`} />
      {!quote && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">جارٍ تحميل الأسعار...</div>
      )}
    </div>
  )
}
