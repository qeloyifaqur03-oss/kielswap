/**
 * Feedback submission store
 * Client-side storage for feedback submissions
 */

const FEEDBACK_STORAGE_KEY = 'kielswap_feedback_v1'

export interface FeedbackSubmission {
  id: string
  createdAtISO: string
  message: string
  contact?: string
}

/**
 * Get all feedback submissions
 * Returns empty array if none or on server
 */
export function getFeedbackSubmissions(): FeedbackSubmission[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Submit feedback
 * Appends feedback to the submissions list in localStorage
 */
export function submitFeedback(message: string, contact?: string): FeedbackSubmission {
  if (typeof window === 'undefined') {
    throw new Error('Cannot submit feedback on server')
  }
  
  const submissions = getFeedbackSubmissions()
  
  // Generate ID
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  const submission: FeedbackSubmission = {
    id,
    createdAtISO: new Date().toISOString(),
    message: message.trim(),
    contact: contact?.trim() || undefined,
  }
  
  const next = [...submissions, submission]
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next))
  
  return submission
}






















