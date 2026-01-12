import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { buildEarlyAccessMessage } from '@/lib/telegramMessages'
import { checkRateLimit, getClientIP } from '@/lib/rateLimit'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  
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

    // Check required environment variables
    const missingEnv: string[] = []
    if (!process.env.TELEGRAM_BOT_TOKEN) missingEnv.push('TELEGRAM_BOT_TOKEN')
    if (!process.env.TELEGRAM_CHAT_ID) missingEnv.push('TELEGRAM_CHAT_ID')
    
    if (missingEnv.length > 0) {
      console.error(`[Early Access API] [${requestId}] Missing environment variables:`, missingEnv)
      return NextResponse.json(
        { ok: false, error: 'ENV_MISSING', missing: missingEnv, requestId },
        { status: 500 }
      )
    }

    // Build and send Telegram message (MUST await and check result)
    const telegramMessage = buildEarlyAccessMessage({
      twitterHandle: twitterHandle.trim(),
      walletAddress: walletAddress?.trim(),
      interest: interest.trim(),
    })

    console.log(`[Early Access API] [${requestId}] Sending Telegram notification...`)
    
    // Await Telegram response and verify it succeeded
    const telegramResult = await sendTelegramMessage(telegramMessage, requestId)
    
    if (!telegramResult.ok) {
      console.error(`[Early Access API] [${requestId}] Telegram failed:`, {
        error: telegramResult.error,
        status: telegramResult.status,
        telegramHttpStatus: telegramResult.telegramHttpStatus,
        telegramOk: telegramResult.telegramOk,
        telegramDescription: telegramResult.telegramDescription,
        body: telegramResult.body,
      })
      return NextResponse.json(
        { ok: false, error: 'TELEGRAM_FAILED', requestId },
        { status: 502 }
      )
    }

    console.log(`[Early Access API] [${requestId}] Telegram notification sent successfully`)
    
    // Build response with optional debug info
    const response: { ok: boolean; requestId: string; debug?: any } = { ok: true, requestId }
    
    // Add debug info if debug mode enabled
    if (process.env.NEXT_PUBLIC_DEBUG_TELEGRAM === '1') {
      response.debug = {
        telegramHttpStatus: telegramResult.telegramHttpStatus,
        telegramOk: telegramResult.telegramOk,
        telegramDescription: telegramResult.telegramDescription,
      }
    }
    
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error(`[Early Access API] [${requestId}] Internal error:`, error)
    // Never return ok:true on error
    return NextResponse.json(
      { ok: false, error: 'INTERNAL', requestId },
      { status: 500 }
    )
  }
}

