/**
 * Environment variable validation and access helper
 * Provides type-safe access to canonical environment variable names
 * 
 * Canonical environment variable names:
 * - ALCHEMY_API_KEY, MORALIS_API_KEY
 * - QUICKNODE_API_KEY, ANKR_API_KEY, CHAINSTACK_API_KEY
 * - RELAY_API_KEY, LIFI_API_KEY, ZEROX_API_KEY, JUPITER_API_KEY
 * - TRONGRID_API_KEY
 * - RANGO_API_KEY
 * - TON_API_KEY
 * - SUI_RPC_URL
 * - APTOS_API_KEY
 * - NEAR_RPC_URL
 * - COINGECKO_API_KEY
 * - HEDERA_MIRROR_URL
 * - STELLAR_HORIZON_URL
 * - MEMPOOL_SPACE_URL_1, MEMPOOL_SPACE_URL_2, MEMPOOL_SPACE_URL_3
 */

type EnvVarName =
  | 'ALCHEMY_API_KEY'
  | 'MORALIS_API_KEY'
  | 'QUICKNODE_API_KEY'
  | 'ANKR_API_KEY'
  | 'CHAINSTACK_API_KEY'
  | 'RELAY_API_KEY'
  | 'LIFI_API_KEY'
  | 'ZEROX_API_KEY'
  | 'JUPITER_API_KEY'
  | 'TRONGRID_API_KEY'
  | 'RANGO_API_KEY'
  | 'TON_API_KEY'
  | 'CHANGENOW_API_KEY'
  | 'SUI_RPC_URL'
  | 'APTOS_API_KEY'
  | 'NEAR_RPC_URL'
  | 'COINGECKO_API_KEY'
  | 'HEDERA_MIRROR_URL'
  | 'STELLAR_HORIZON_URL'
  | 'MEMPOOL_SPACE_URL_1'
  | 'MEMPOOL_SPACE_URL_2'
  | 'MEMPOOL_SPACE_URL_3'

/**
 * Get environment variable value (server-side only)
 * Returns undefined if not set
 */
export function getEnv(name: EnvVarName): string | undefined {
  if (typeof window !== 'undefined') {
    throw new Error(`getEnv('${name}') called on client-side. Environment variables should only be accessed server-side.`)
  }
  return process.env[name]
}

/**
 * Get environment variable value with fallback
 */
export function getEnvWithDefault(name: EnvVarName, defaultValue: string): string {
  return getEnv(name) ?? defaultValue
}

/**
 * Require environment variable - throws if not set
 * Use this for required configuration
 */
export function requireEnv(name: EnvVarName): string {
  const value = getEnv(name)
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set. Please add it to your .env.local file.`)
  }
  return value
}

/**
 * Validate that required environment variables are set for a specific provider
 * Returns array of missing variable names
 */
export function validateProviderEnv(provider: 'relay' | 'lifi' | '0x' | 'jupiter' | 'alchemy'): string[] {
  const required: Record<string, EnvVarName[]> = {
    relay: ['RELAY_API_KEY'],
    lifi: [], // LiFi doesn't require API key
    '0x': [], // 0x API key is optional
    jupiter: [], // Jupiter doesn't require API key
    alchemy: [], // Alchemy API key is optional
  }

  const missing: string[] = []
  const vars = required[provider] || []

  for (const varName of vars) {
    if (!getEnv(varName)) {
      missing.push(varName)
    }
  }

  return missing
}

/**
 * Get all configured API keys (for debugging/logging purposes)
 * Returns object with boolean flags indicating which keys are set
 * Never returns actual key values for security
 */
export function getEnvStatus(): Record<EnvVarName, boolean> {
  const allVars: EnvVarName[] = [
    'ALCHEMY_API_KEY',
    'MORALIS_API_KEY',
    'QUICKNODE_API_KEY',
    'ANKR_API_KEY',
    'CHAINSTACK_API_KEY',
    'RELAY_API_KEY',
    'LIFI_API_KEY',
    'ZEROX_API_KEY',
    'JUPITER_API_KEY',
    'TRONGRID_API_KEY',
    'RANGO_API_KEY',
    'TON_API_KEY',
    'CHANGENOW_API_KEY',
    'SUI_RPC_URL',
    'APTOS_API_KEY',
    'NEAR_RPC_URL',
    'COINGECKO_API_KEY',
    'HEDERA_MIRROR_URL',
    'STELLAR_HORIZON_URL',
    'MEMPOOL_SPACE_URL_1',
    'MEMPOOL_SPACE_URL_2',
    'MEMPOOL_SPACE_URL_3',
  ]

  const status: Record<string, boolean> = {}
  for (const varName of allVars) {
    status[varName] = !!getEnv(varName as EnvVarName)
  }

  return status as Record<EnvVarName, boolean>
}

// Legacy support - check for old/incorrect variable names and warn
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const deprecatedNames: Record<string, EnvVarName> = {
    APTOPS_API_KEY: 'APTOS_API_KEY', // Typo fix
    NEXT_PUBLIC_ALCHEMY_API_KEY: 'ALCHEMY_API_KEY', // Should not be public
  }

  for (const [oldName, correctName] of Object.entries(deprecatedNames)) {
    if (process.env[oldName]) {
      console.warn(
        `[env] Deprecated environment variable ${oldName} found. Please use ${correctName} instead.`
      )
    }
  }

  // Warn about non-canonical names that should be removed
  const nonCanonical = [
    'INFURA_API_KEY', // Not in canonical list
    'near_api_key',
    'stellar_horizon_api_key',
    'sui_endpoint',
    'getblock_endpoint',
  ]

  for (const varName of nonCanonical) {
    if (process.env[varName]) {
      console.warn(
        `[env] Non-canonical environment variable ${varName} found. This variable is not in the canonical list and should be removed or replaced.`
      )
    }
  }
}

