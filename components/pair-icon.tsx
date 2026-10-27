/* eslint-disable @next/next/no-img-element */
import type { SymbolDef } from '@/lib/symbols'

export function PairIcon({ symbol, size = 32 }: { symbol: SymbolDef; size?: number }) {
  const icon = symbol.icon
  if (icon.kind === 'brand') {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, background: icon.bg }}
      >
        <img
          src={`https://cdn.simpleicons.org/${icon.slug}/${icon.color}`}
          alt=""
          width={size * 0.56}
          height={size * 0.56}
          crossOrigin="anonymous"
        />
      </span>
    )
  }
  const flag = size * 0.72
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
      <img
        src={`https://flagcdn.com/w80/${icon.base}.png`}
        alt=""
        className="absolute top-0 right-0 rounded-full object-cover ring-2 ring-bg"
        style={{ width: flag, height: flag }}
      />
      <img
        src={`https://flagcdn.com/w80/${icon.quote}.png`}
        alt=""
        className="absolute bottom-0 left-0 rounded-full object-cover ring-2 ring-bg"
        style={{ width: flag, height: flag }}
      />
    </span>
  )
}
