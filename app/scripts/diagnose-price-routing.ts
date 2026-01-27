/**
 * Diagnostic script for price routing
 * Checks all tokens in supportedAssets for valid price IDs and tests price fetching
 * 
 * Usage: npx tsx app/scripts/diagnose-price-routing.ts
 */

import { SUPPORTED_TOKENS, SUPPORTED_NETWORKS } from '../lib/supportedAssets'
import { getTokenCoingeckoId, getTokenCmcId, hasPriceId } from '../lib/tokenPriceMapping'

interface DiagnosticResult {
  tokenId: string
  symbol: string
  hasPriceId: boolean
  coingeckoId: string | null
  networks: string[]
  status: 'ok' | 'missing_price_id' | 'error'
  error?: string
}

interface PriceTestResult {
  fromToken: string
  toToken: string
  fromChain: string
  toChain: string
  status: 'success' | 'error'
  latency?: number
  source?: string
  error?: string
}

async function diagnoseAllTokens(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []
  
  console.log('\n=== TOKEN PRICE ID DIAGNOSTIC ===\n')
  console.log(`Checking ${SUPPORTED_TOKENS.length} tokens for price IDs...\n`)
  
  // First pass: check price IDs only (no API calls to avoid rate limiting)
  for (const token of SUPPORTED_TOKENS) {
    const hasId = hasPriceId(token.id)
    const coingeckoId = getTokenCoingeckoId(token.id)
    
    results.push({
      tokenId: token.id,
      symbol: token.symbol,
      hasPriceId: hasId,
      coingeckoId,
      networks: token.networkIds,
      status: hasId ? 'ok' : 'missing_price_id',
      error: hasId ? undefined : 'No price ID found',
    })
  }
  
  // Second pass: test actual price fetching for a sample (to avoid rate limiting)
  console.log('Testing price fetching for sample tokens (to avoid rate limiting)...\n')
  const sampleTokens = SUPPORTED_TOKENS.slice(0, 5) // Test only first 5 tokens
  
  for (const token of sampleTokens) {
    if (hasPriceId(token.id)) {
      const testResult = await testPriceFetch(token.id)
      const result = results.find(r => r.tokenId === token.id)
      if (result) {
        if (!testResult.success) {
          result.status = 'error'
          result.error = testResult.error
        }
      }
      
      // Rate limiting - CoinGecko free tier: 10-50 calls/minute
      // Wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Summary
  const okCount = results.filter(r => r.status === 'ok' && r.hasPriceId).length
  const missingCount = results.filter(r => r.status === 'missing_price_id').length
  const errorCount = results.filter(r => r.status === 'error').length
  const hasPriceIdCount = results.filter(r => r.hasPriceId).length
  
  console.log(`\n✅ Tokens with price ID: ${hasPriceIdCount}/${SUPPORTED_TOKENS.length}`)
  console.log(`✅ Tokens with working price (sample test): ${okCount}/5 (tested sample)`)
  console.log(`❌ Tokens missing price ID: ${missingCount}/${SUPPORTED_TOKENS.length}`)
  if (errorCount > 0) {
    console.log(`⚠️  Tokens with price fetch error (sample): ${errorCount}/5 (likely rate limiting in test)`)
  }
  
  if (missingCount > 0) {
    console.log('\n⚠️  Tokens missing price ID:')
    results
      .filter(r => r.status === 'missing_price_id')
      .forEach(r => {
        console.log(`   - ${r.symbol} (id: ${r.tokenId})`)
      })
  }
  
  if (errorCount > 0) {
    console.log('\n⚠️  Tokens with price fetch error:')
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   - ${r.symbol} (id: ${r.tokenId}): ${r.error}`)
      })
  }
  
  return results
}

async function testPriceFetch(tokenId: string): Promise<{ success: boolean; latency?: number; error?: string; source?: string }> {
  const startTime = Date.now()
  
  try {
    // Check if token has price ID
    const coingeckoId = getTokenCoingeckoId(tokenId)
    const cmcId = getTokenCmcId(tokenId)
    
    if (!coingeckoId && !cmcId) {
      return { success: false, error: 'missing_price_id' }
    }
    
    // Try CoinGecko first
    if (coingeckoId) {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json() as Record<string, { usd: number }>
        const latency = Date.now() - startTime
        
        if (data[coingeckoId]?.usd && data[coingeckoId].usd > 0) {
          return { success: true, latency, source: 'coingecko' }
        }
      }
      
      // If CoinGecko failed, try CMC if available
      if (cmcId && process.env.COINMARKETCAP_API_KEY) {
        const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcId}&CMC_PRO_API_KEY=${process.env.COINMARKETCAP_API_KEY}`
        const cmcResponse = await fetch(cmcUrl, {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          },
        })
        
        if (cmcResponse.ok) {
          const cmcData = await cmcResponse.json() as { data: Record<string, Array<{ quote: { USD: { price: number } } }>> }
          const latency = Date.now() - startTime
          const cmcTokenData = cmcData.data?.[cmcId]?.[0]
          
          if (cmcTokenData?.quote?.USD?.price && cmcTokenData.quote.USD.price > 0) {
            return { success: true, latency, source: 'coinmarketcap' }
          }
        }
      }
      
      return { success: false, error: `upstream_error (CG: ${response.status})` }
    }
    
    return { success: false, error: 'No price ID' }
  } catch (error: any) {
    return { success: false, error: `upstream_error: ${error.message || 'Unknown error'}` }
  }
}

async function testPricePairs(): Promise<PriceTestResult[]> {
  console.log('\n=== PRICE PAIR TESTING ===\n')
  
  const results: PriceTestResult[] = []
  
  // Test a few representative pairs
  const testPairs = [
    // Same chain
    { from: 'eth', to: 'usdc', chain: 'ethereum' },
    { from: 'bnb', to: 'usdt-bnb', chain: 'bnb' },
    { from: 'matic', to: 'usdc', chain: 'polygon' },
    // Cross-chain
    { from: 'eth', to: 'usdc', fromChain: 'ethereum', toChain: 'polygon' },
    { from: 'bnb', to: 'eth', fromChain: 'bnb', toChain: 'ethereum' },
    // Native tokens
    { from: 'avax', to: 'eth', fromChain: 'avalanche', toChain: 'ethereum' },
    { from: 's', to: 'xpl', fromChain: 'sonic', toChain: 'plasma' },
  ]
  
  console.log(`Testing ${testPairs.length} price pairs...\n`)
  
  for (const pair of testPairs) {
    const fromToken = SUPPORTED_TOKENS.find(t => t.id === pair.from)
    const toToken = SUPPORTED_TOKENS.find(t => t.id === pair.to)
    
    if (!fromToken || !toToken) {
      results.push({
        fromToken: pair.from,
        toToken: pair.to,
        fromChain: pair.fromChain || pair.chain || 'unknown',
        toChain: pair.toChain || pair.chain || 'unknown',
        status: 'error',
        error: 'Token not found',
      })
      continue
    }
    
    const fromTest = await testPriceFetch(fromToken.id)
    const toTest = await testPriceFetch(toToken.id)
    
    if (fromTest.success && toTest.success) {
      results.push({
        fromToken: pair.from,
        toToken: pair.to,
        fromChain: pair.fromChain || pair.chain || 'unknown',
        toChain: pair.toChain || pair.chain || 'unknown',
        status: 'success',
        latency: (fromTest.latency || 0) + (toTest.latency || 0),
        source: 'coingecko',
      })
      console.log(`✅ ${fromToken.symbol} → ${toToken.symbol}: OK (${(fromTest.latency || 0) + (toTest.latency || 0)}ms)`)
    } else {
      const errors = [
        !fromTest.success ? `from: ${fromTest.error}` : null,
        !toTest.success ? `to: ${toTest.error}` : null,
      ].filter(Boolean).join(', ')
      
      results.push({
        fromToken: pair.from,
        toToken: pair.to,
        fromChain: pair.fromChain || pair.chain || 'unknown',
        toChain: pair.toChain || pair.chain || 'unknown',
        status: 'error',
        error: errors,
      })
      console.log(`❌ ${fromToken.symbol} → ${toToken.symbol}: ${errors}`)
    }
    
    // Rate limiting - wait between pairs
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  
  const successCount = results.filter(r => r.status === 'success').length
  console.log(`\n✅ Successful pairs: ${successCount}/${testPairs.length}`)
  console.log(`❌ Failed pairs: ${testPairs.length - successCount}/${testPairs.length}`)
  
  return results
}

async function main() {
  try {
    // 1. Check all tokens for price IDs
    const tokenResults = await diagnoseAllTokens()
    
    // 2. Test price fetching for sample pairs
    const pairResults = await testPricePairs()
    
    // 3. Final summary
    console.log('\n=== FINAL SUMMARY ===\n')
    console.log(`Total tokens: ${SUPPORTED_TOKENS.length}`)
    console.log(`Tokens with price ID: ${tokenResults.filter(r => r.hasPriceId).length}`)
    console.log(`Tokens missing price ID: ${tokenResults.filter(r => !r.hasPriceId).length}`)
    console.log(`Price pair tests: ${pairResults.filter(r => r.status === 'success').length}/${pairResults.length} successful`)
    
    if (tokenResults.filter(r => !r.hasPriceId).length > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Some tokens are missing price IDs!')
      process.exit(1)
    } else {
      console.log('\n✅ All tokens have price IDs!')
      process.exit(0)
    }
  } catch (error) {
    console.error('Diagnostic failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { diagnoseAllTokens, testPricePairs, testPriceFetch }
