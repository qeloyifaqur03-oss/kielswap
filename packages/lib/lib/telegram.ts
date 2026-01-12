/**
 * Telegram notification service
 * Sends messages to Telegram group via bot
 */

/**
 * Sanitize user input for HTML
 * Escapes &, <, >, "
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Send message to Telegram
 * @param text HTML-formatted message text
 * @param requestId Optional request ID for logging
 * @returns Promise that resolves with { ok: boolean, error?: string, status?: number, body?: any, telegramHttpStatus?: number, telegramOk?: boolean, telegramDescription?: string } - never silently fails
 */
export async function sendTelegramMessage(
  text: string,
  requestId?: string
): Promise<{ 
  ok: boolean
  error?: string
  status?: number
  body?: any
  telegramHttpStatus?: number
  telegramOk?: boolean
  telegramDescription?: string
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  let chatId = process.env.TELEGRAM_CHAT_ID

  // If env not set, return error (don't silently fail)
  if (!token || !chatId) {
    const missing = []
    if (!token) missing.push('TELEGRAM_BOT_TOKEN')
    if (!chatId) missing.push('TELEGRAM_CHAT_ID')
    console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} Missing environment variables:`, missing)
    return { ok: false, error: `Missing env: ${missing.join(', ')}` }
  }

  // Log before sending (mask chat ID partially)
  const maskedChatId = chatId.length > 4 
    ? chatId.substring(0, 2) + '***' + chatId.substring(chatId.length - 2)
    : '***'
  console.log(`[Telegram]${requestId ? ` [${requestId}]` : ''} Sending message:`, {
    chatId: maskedChatId,
    messageLength: text.length,
  })

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  
  // Retry configuration: 2 retries (total 3 attempts)
  const maxAttempts = 3
  const backoffDelays = [0, 250, 750] // ms delays before each attempt

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add backoff delay (except first attempt)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt]))
      }

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let responseData: any = null
      
      try {
        responseData = JSON.parse(responseText)
      } catch {
        // Not JSON - treat as error
        console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} Invalid JSON response:`, responseText.substring(0, 200))
        return { 
          ok: false, 
          error: 'TELEGRAM_API_NOT_OK', 
          status: response.status, 
          body: responseText,
          telegramHttpStatus: response.status,
          telegramOk: false,
        }
      }

      // Log response details
      console.log(`[Telegram]${requestId ? ` [${requestId}]` : ''} Response:`, {
        httpStatus: response.status,
        telegramOk: responseData?.ok,
        description: responseData?.description,
        errorCode: responseData?.error_code,
      })

      // Check for migration to supergroup (before жёсткая проверка)
      if (response.status === 400 && responseData?.parameters?.migrate_to_chat_id) {
        const newChatId = String(responseData.parameters.migrate_to_chat_id)
        
        // Log warning with new chat ID
        console.warn(`[Telegram]${requestId ? ` [${requestId}]` : ''} Chat upgraded to supergroup. Update TELEGRAM_CHAT_ID to: ${newChatId}`)
        
        // Update chatId and retry immediately (without backoff delay)
        chatId = newChatId
        
        // Retry with new chat_id (create new controller for retry)
        const retryController = new AbortController()
        const retryTimeoutId = setTimeout(() => retryController.abort(), 4000)
        
        try {
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: newChatId,
              text: text,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            }),
            signal: retryController.signal,
          })
          
          clearTimeout(retryTimeoutId)
          
          const retryText = await retryResponse.text()
          let retryData: any = null
          try {
            retryData = JSON.parse(retryText)
          } catch {
            // Not JSON - treat as error
            console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} Migration retry: Invalid JSON response`)
            throw new Error(`Migration retry failed: Invalid JSON`)
          }
          
          // ЖЁСТКАЯ проверка для migration retry
          if (retryResponse.ok && retryData?.ok === true) {
            // Success after migration
            console.log(`[Telegram]${requestId ? ` [${requestId}]` : ''} Notification sent successfully after migration`)
            return { 
              ok: true,
              telegramHttpStatus: retryResponse.status,
              telegramOk: true,
            }
          } else {
            // Migration retry failed
            const errorMsg = retryData?.description || 'Unknown error after migration'
            console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} Migration retry failed:`, errorMsg)
            return {
              ok: false,
              error: 'TELEGRAM_API_NOT_OK',
              status: retryResponse.status,
              body: retryData,
              telegramHttpStatus: retryResponse.status,
              telegramOk: retryData?.ok,
              telegramDescription: errorMsg,
            }
          }
        } catch (retryError) {
          // If retry failed, continue with normal retry logic
          throw new Error(`Telegram API error after migration: ${responseData?.description || 'Unknown error'}`)
        }
      }

      // ЖЁСТКАЯ проверка: успех = (response.ok === true) И (json.ok === true)
      if (response.ok && responseData?.ok === true) {
        // Success
        console.log(`[Telegram]${requestId ? ` [${requestId}]` : ''} Notification sent successfully`)
        return { 
          ok: true,
          telegramHttpStatus: response.status,
          telegramOk: true,
        }
      } else {
        // Failure: либо HTTP не ok, либо json.ok !== true
        const errorMsg = responseData?.description || 'Unknown error'
        const errorCode = responseData?.error_code
        console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} API failed:`, {
          httpStatus: response.status,
          telegramOk: responseData?.ok,
          description: errorMsg,
          errorCode: errorCode,
          fullBody: responseData,
        })
        return { 
          ok: false, 
          error: 'TELEGRAM_API_NOT_OK',
          status: response.status, 
          body: responseData,
          telegramHttpStatus: response.status,
          telegramOk: responseData?.ok,
          telegramDescription: errorMsg,
        }
      }
    } catch (error: any) {
      const isLastAttempt = attempt === maxAttempts - 1
      
      if (isLastAttempt) {
        // Final attempt failed - return error (never silently fail)
        const errorMsg = error?.message || String(error)
        console.error(`[Telegram]${requestId ? ` [${requestId}]` : ''} Failed to send notification after all retries:`, {
          error: errorMsg,
          // Don't log full token/chat_id
          tokenPrefix: token?.substring(0, 10) + '...',
        })
        return { 
          ok: false, 
          error: errorMsg,
          telegramHttpStatus: undefined,
          telegramOk: false,
        }
      }
      
      // Not last attempt - will retry
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Telegram] Attempt ${attempt + 1} failed, retrying...`, error?.message)
      }
    }
  }
  
  // Should never reach here, but TypeScript requires return
  return { ok: false, error: 'All retry attempts exhausted' }
}

