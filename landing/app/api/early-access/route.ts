import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { buildEarlyAccessMessage } from '@/lib/telegramMessages'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const allowed = await checkRateLimit(ip)
    
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMIT' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { twitterHandle, walletAddress, interest, consent } = body

    // Validation
    if (!twitterHandle || typeof twitterHandle !== 'string' || !twitterHandle.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Twitter handle is required' },
        { status: 400 }
      )
    }

    // Length validation
    if (twitterHandle.length > 50) {
      return NextResponse.json(
        { ok: false, error: 'Twitter handle too long' },
        { status: 400 }
      )
    }

    // Wallet address is now required
    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.trim()) {
      return NextResponse.json(
        { ok: false, error: 'WALLET_REQUIRED' },
        { status: 400 }
      )
    }

    if (walletAddress.trim().length < 10) {
      return NextResponse.json(
        { ok: false, error: 'WALLET_REQUIRED' },
        { status: 400 }
      )
    }

    if (walletAddress.length > 100) {
      return NextResponse.json(
        { ok: false, error: 'Wallet address too long' },
        { status: 400 }
      )
    }

    if (!interest || typeof interest !== 'string' || !interest.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Interest field is required' },
        { status: 400 }
      )
    }

    if (interest.length > 2000) {
      return NextResponse.json(
        { ok: false, error: 'Interest field too long' },
        { status: 400 }
      )
    }

    if (!consent || consent !== true) {
      return NextResponse.json(
        { ok: false, error: 'Consent is required' },
        { status: 400 }
      )
    }

    // Build and send Telegram message (non-blocking)
    const telegramMessage = buildEarlyAccessMessage({
      twitterHandle: twitterHandle.trim(),
      walletAddress: walletAddress?.trim(),
      interest: interest.trim(),
    })

    // Send notification (don't await - fire and forget)
    sendTelegramMessage(telegramMessage).catch((error) => {
      // Log error but don't fail the request
      console.error('[Early Access API] Failed to send Telegram notification:', error)
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[Early Access API Error]', error)
    // Return success even on error to not break UX
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

