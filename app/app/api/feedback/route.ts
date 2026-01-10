import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { buildFeedbackMessage } from '@/lib/telegramMessages'
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
    const { message, contact, walletAddress, page } = body

    // Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Length validation
    if (message.length > 2000) {
      return NextResponse.json(
        { ok: false, error: 'Message too long' },
        { status: 400 }
      )
    }

    // Contact is now required
    if (!contact || typeof contact !== 'string' || !contact.trim()) {
      return NextResponse.json(
        { ok: false, error: 'CONTACT_REQUIRED' },
        { status: 400 }
      )
    }

    if (contact.length > 100) {
      return NextResponse.json(
        { ok: false, error: 'Contact field too long' },
        { status: 400 }
      )
    }

    if (walletAddress && typeof walletAddress === 'string' && walletAddress.length > 100) {
      return NextResponse.json(
        { ok: false, error: 'Wallet address too long' },
        { status: 400 }
      )
    }

    // Build and send Telegram message (non-blocking)
    const telegramMessage = buildFeedbackMessage({
      message: message.trim(),
      contact: contact?.trim(),
      walletAddress: walletAddress?.trim(),
      page: page || '/swap',
    })

    // Send notification (don't await - fire and forget)
    sendTelegramMessage(telegramMessage).catch((error) => {
      // Log error but don't fail the request
      console.error('[Feedback API] Failed to send Telegram notification:', error)
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[Feedback API Error]', error)
    // Return success even on error to not break UX
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

