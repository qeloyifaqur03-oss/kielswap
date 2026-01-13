/**
 * Input validation utilities using Zod
 */

import { z } from 'zod'

// Ethereum address validation (0x + 40 hex chars)
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

// Common validation schemas
export const schemas = {
  // Twitter handle: 1-32 chars, alphanumeric + underscore
  twitterHandle: z.string()
    .min(1, 'Twitter handle is required')
    .max(32, 'Twitter handle too long')
    .trim(),
  
  // Wallet address: optional, but if present must be valid format
  walletAddress: z.string()
    .optional()
    .refine((val) => !val || val.trim().length >= 10, 'Wallet address too short')
    .refine((val) => !val || val.trim().length <= 100, 'Wallet address too long')
    .transform((val) => val?.trim()),
  
  // Ethereum address (strict)
  ethAddress: z.string()
    .regex(ETH_ADDRESS_REGEX, 'Invalid Ethereum address format')
    .transform((val) => val.toLowerCase()),
  
  // Interest/feedback text
  interest: z.string()
    .min(1, 'Field is required')
    .max(500, 'Text too long')
    .trim(),
  
  feedback: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long')
    .trim(),
  
  // Consent must be true
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
  
  // Access code
  accessCode: z.string()
    .min(4, 'Code too short')
    .max(64, 'Code too long')
    .trim(),
  
  // Chain ID
  chainId: z.number().int().positive(),
  
  // Amount (numeric string)
  amount: z.string()
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, 'Amount must be a positive number'),
  
  // Token IDs list (max 100)
  tokenIds: z.string()
    .refine((val) => {
      const ids = val.split(',').filter(Boolean)
      return ids.length > 0 && ids.length <= 100
    }, 'Invalid token IDs (max 100)'),
}

// Route-specific validation schemas
export const routeSchemas = {
  'early-access': z.object({
    twitterHandle: schemas.twitterHandle,
    walletAddress: schemas.walletAddress,
    interest: schemas.interest,
    consent: schemas.consent,
  }),
  
  'feedback': z.object({
    message: schemas.feedback,
    contact: z.string().min(1, 'Contact is required').max(100, 'Contact too long').trim(),
    walletAddress: schemas.walletAddress,
    page: z.string().optional(),
  }),
  
  'access-verify': z.object({
    code: schemas.accessCode,
  }),
  
  'token-price': z.object({
    ids: schemas.tokenIds,
  }),
  
  'quote': z.object({
    fromTokenId: z.string().min(1, 'fromTokenId is required'),
    toTokenId: z.string().min(1, 'toTokenId is required'),
    fromNetworkId: z.string().min(1, 'fromNetworkId is required'),
    toNetworkId: z.string().min(1, 'toNetworkId is required'),
    amount: schemas.amount,
    userAddress: z.string().optional().refine((val) => !val || /^0x[a-fA-F0-9]{40}$/.test(val), 'Invalid Ethereum address format'),
    requestId: z.string().optional(),
  }),
  
  'route-plan': z.object({
    fromNetworkId: z.string().min(1),
    toNetworkId: z.string().min(1),
    amountBase: z.string().min(1),
  }),
  
  'execute': z.object({
    provider: z.enum(['changenow']),
    fromNetworkId: z.string().min(1),
    toNetworkId: z.string().min(1),
    fromTokenSymbol: z.string().min(1),
    toTokenSymbol: z.string().min(1),
    amountHuman: z.string().min(1),
    user: z.object({
      evmAddress: z.string().optional(),
      tonAddress: z.string().optional(),
      tronAddress: z.string().optional(),
    }),
  }),
  
  'status': z.object({
    provider: z.enum(['changenow']),
    txId: z.string().min(1),
  }),
}

/**
 * Validate request body against schema
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
  requestId?: string
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const result = schema.safeParse(body)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: 'BAD_REQUEST',
        details: result.error.errors,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: Record<string, string | string[] | undefined>,
  requestId?: string
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    // Convert query to plain object (take first value if array)
    const plainQuery: Record<string, string> = {}
    for (const [key, value] of Object.entries(query)) {
      plainQuery[key] = Array.isArray(value) ? value[0] : (value || '')
    }
    
    const result = schema.safeParse(plainQuery)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: 'BAD_REQUEST',
        details: result.error.errors,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
