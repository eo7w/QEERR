// Deterministic OTC price curve: identical on server and client for any timestamp,
// so the chart, trade open and trade settlement always agree while the market is closed.
const WAVES: Array<[periodSec: number, amplitude: number]> = [
  [5400, 0.0011],
  [1310, 0.0006],
  [433, 0.00034],
  [97, 0.00018],
  [29, 0.00009],
  [7.3, 0.000045],
  [2.9, 0.00002],
]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function otcPrice(symbol: string, anchor: number, timeMs: number, vol = 1) {
  const seed = hash(symbol)
  const t = timeMs / 1000
  let x = 0
  for (let i = 0; i < WAVES.length; i++) {
    const [period, amp] = WAVES[i]
    const phase = (((seed >>> (i * 4)) & 0xff) / 255) * Math.PI * 2
    x += amp * Math.sin((2 * Math.PI * t) / period + phase)
  }
  return anchor * (1 + x * vol)
}
