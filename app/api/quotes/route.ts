import { NextResponse } from 'next/server'
import { getAllQuotes } from '@/lib/quotes'

export const dynamic = 'force-dynamic'

export async function GET() {
  const quotes = await getAllQuotes()
  return NextResponse.json({ serverTime: Date.now(), quotes }, { headers: { 'Cache-Control': 'no-store' } })
}
