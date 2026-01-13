import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { buildFeedbackMessage } from '@/lib/telegramMessages'
import { checkRateLimit, getClientIP } from '@/lib/api/rateLimit'
import { validateBody, routeSchemas } from '@/lib/api/validate'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = await checkRateLimit('feedback', ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter, requestId },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate body with Zod
    const validation = validateBody(routeSchemas['feedback'], body, requestId)
    if (!validation.success) {
      console.error(`[Feedback API] [${requestId}] Validation failed:`, validation.details)
      return NextResponse.json(
        { ok: false, error: validation.error, details: validation.details, requestId },
        { status: 400 }
      )
    }

    const { message, contact, walletAddress, page } = validation.data

    // Build and send Telegram message (non-blocking)
    const telegramMessage = buildFeedbackMessage({
      message: message.trim(),
      contact: contact?.trim(),
      walletAddress: walletAddress?.trim(),
      page: page || '/swap',
    })

    // Send notification (don't await - fire and forget)
    sendTelegramMessage(telegramMessage, requestId).catch((error) => {
      // Log error but don't fail the request
      console.error(`[Feedback API] [${requestId}] Failed to send Telegram notification:`, error)
    })

    return NextResponse.json({ ok: true, requestId }, { status: 200 })
  } catch (error) {
    console.error(`[Feedback API] [${requestId}] Internal error:`, error)
    return NextResponse.json(
      { ok: false, error: 'INTERNAL', requestId },
      { status: 500 }
    )
  }
}

