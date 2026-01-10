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
 * @returns Promise that resolves when message is sent (or silently fails)
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  let chatId = process.env.TELEGRAM_CHAT_ID

  // If env not set, log warning and return (don't crash)
  if (!token || !chatId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping notification')
    }
    return
  }

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
        // Not JSON, will handle as text
      }

      if (response.ok) {
        if (responseData?.ok) {
          // Success - log in dev mode only
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Telegram] Notification sent successfully')
          }
          return
        } else {
          throw new Error(`Telegram API error: ${responseData?.description || 'Unknown error'}`)
        }
      } else {
        // Check for migration to supergroup
        if (response.status === 400 && responseData?.parameters?.migrate_to_chat_id) {
          const newChatId = String(responseData.parameters.migrate_to_chat_id)
          
          // Log warning with new chat ID
          console.warn(`[Telegram] Chat upgraded to supergroup. Update TELEGRAM_CHAT_ID to: ${newChatId}`)
          
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
            
            if (retryResponse.ok) {
              const retryText = await retryResponse.text()
              let retryData: any = null
              try {
                retryData = JSON.parse(retryText)
              } catch {}
              
              if (retryData?.ok) {
                // Success after migration
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[Telegram] Notification sent successfully after migration')
                }
                return
              }
            }
          } catch (retryError) {
            // If retry failed, continue with normal retry logic
          }
          
          // If retry failed, throw to continue with normal retry logic
          throw new Error(`Telegram API error after migration: ${responseData?.description || 'Unknown error'}`)
        }
        
        throw new Error(`HTTP ${response.status}: ${responseText}`)
      }
    } catch (error: any) {
      const isLastAttempt = attempt === maxAttempts - 1
      
      if (isLastAttempt) {
        // Final attempt failed - log error but don't throw (don't break UX)
        console.error('[Telegram] Failed to send notification after all retries:', {
          error: error?.message || String(error),
          // Don't log full token/chat_id
          tokenPrefix: token?.substring(0, 10) + '...',
        })
        return // Silently fail
      }
      
      // Not last attempt - will retry
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Telegram] Attempt ${attempt + 1} failed, retrying...`, error?.message)
      }
    }
  }
}

