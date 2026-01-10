/**
 * Robust fetch helper with timeout and retry logic for external provider APIs
 * Server-side only (Node.js runtime)
 */

export interface FetchJsonOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeoutMs?: number
  retries?: number
}

export interface FetchJsonResult<T = any> {
  ok: boolean
  data?: T
  status?: number
  error?: string
  errorCode?: string
}

/**
 * Fetch JSON with timeout and retry logic
 * - Default timeout: 12s for external providers, 8s for fast ones
 * - Retry once (default) for network errors/timeouts only (not HTTP errors)
 * - Returns structured result instead of throwing
 */
export async function fetchJson<T = any>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<FetchJsonResult<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 12000, // 12s default for external providers
    retries = 1, // Retry once by default
  } = options

  const attempt = async (isRetry: boolean = false): Promise<FetchJsonResult<T>> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      }

      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: `HTTP ${response.status}`,
          errorCode: response.status === 404 ? 'NOT_FOUND' : response.status >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR',
        }
      }

      const data = await response.json()
      return {
        ok: true,
        data,
        status: response.status,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      // Check if it's a network error or timeout (retryable)
      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('network'))

      if (isNetworkError && !isRetry && retries > 0) {
        // Retry with small backoff (200-400ms jitter)
        const backoff = 200 + Math.random() * 200
        await new Promise((resolve) => setTimeout(resolve, backoff))
        return attempt(true)
      }

      // Final failure or non-retryable error
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      }
    }
  }

  return attempt(false)
}

















