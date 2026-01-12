import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

/**
 * Telegram test endpoint
 * GET: sends a test message to verify Telegram integration
 * Returns detailed result for debugging
 */
export async function GET(request: NextRequest) {
  const requestId = `test-${Date.now()}`
  
  try {
    // Check required environment variables
    const missingEnv: string[] = []
    if (!process.env.TELEGRAM_BOT_TOKEN) missingEnv.push('TELEGRAM_BOT_TOKEN')
    if (!process.env.TELEGRAM_CHAT_ID) missingEnv.push('TELEGRAM_CHAT_ID')
    
    if (missingEnv.length > 0) {
      console.error(`[Telegram Test] [${requestId}] Missing environment variables:`, missingEnv)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'ENV_MISSING', 
          missing: missingEnv,
          requestId,
        },
        { status: 500 }
      )
    }

    // Send test message
    const testMessage = `kielswap telegram test ${Date.now()}`
    console.log(`[Telegram Test] [${requestId}] Sending test message...`)
    
    const telegramResult = await sendTelegramMessage(testMessage, requestId)
    
    // Return detailed result
    return NextResponse.json({
      ok: telegramResult.ok,
      requestId,
      telegram: {
        httpStatus: telegramResult.telegramHttpStatus,
        telegramOk: telegramResult.telegramOk,
        description: telegramResult.telegramDescription,
        error: telegramResult.error,
        body: telegramResult.body,
      },
      message: telegramResult.ok 
        ? 'Test message sent successfully' 
        : 'Test message failed',
    }, { 
      status: telegramResult.ok ? 200 : 502 
    })
  } catch (error) {
    console.error(`[Telegram Test] [${requestId}] Internal error:`, error)
    return NextResponse.json(
      { 
        ok: false, 
        error: 'INTERNAL', 
        requestId,
        message: String(error),
      },
      { status: 500 }
    )
  }
}
