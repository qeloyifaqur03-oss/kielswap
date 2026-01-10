/**
 * Execution orchestrator - builds unsigned transaction payloads
 */

import { RoutePlan, RouteStep, WalletContext, Family } from '../routing/types'
import { getEnvWithDefault } from '../env'

const isDev = process.env.NODE_ENV === 'development'

export type ExecutionState = 'PENDING' | 'SIGN_REQUIRED' | 'SUBMITTED' | 'CONFIRMED' | 'COMPLETED' | 'FAILED'

export interface ExecutionStepState {
  stepId: string
  state: ExecutionState
  txHash?: string
  error?: string
  unsignedTx?: any // Provider-specific unsigned transaction payload
}

export interface Execution {
  id: string
  planId: string
  plan: RoutePlan
  steps: ExecutionStepState[]
  currentStepIndex: number
  state: ExecutionState
  createdAt: number
  updatedAt: number
}

// In-memory execution store (in production, use database)
const executionStore = new Map<string, Execution>()

/**
 * Generate execution ID
 */
function generateExecutionId(): string {
  return `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Build unsigned transaction payload for a step
 */
async function buildUnsignedTx(
  step: RouteStep,
  wallets: WalletContext
): Promise<{ unsignedTx: any; requiresSignature: boolean }> {
  switch (step.family) {
    case 'EVM': {
      // EVM: Build transaction from provider quote
      const quote = step.quote
      
      if (!quote) {
        throw new Error('Quote missing for EVM step')
      }

      // Different providers return different tx formats
      if (step.provider === 'relay') {
        // Relay returns transaction in quote.tx or quote.transactionRequest
        return {
          unsignedTx: {
            to: quote.tx?.to || quote.transactionRequest?.to || quote.to,
            data: quote.tx?.data || quote.transactionRequest?.data || quote.data,
            value: quote.tx?.value || quote.transactionRequest?.value || quote.value || '0',
            gasLimit: quote.tx?.gasLimit || quote.transactionRequest?.gasLimit || quote.gasLimit,
            chainId: step.from.chainId,
          },
          requiresSignature: true,
        }
      } else if (step.provider === 'lifi') {
        // LiFi returns transaction in quote.transactionRequest
        return {
          unsignedTx: {
            to: quote.transactionRequest?.to || quote.to,
            data: quote.transactionRequest?.data || quote.data,
            value: quote.transactionRequest?.value || quote.value || '0',
            gasLimit: quote.transactionRequest?.gasLimit || quote.gasLimit,
            chainId: step.from.chainId,
          },
          requiresSignature: true,
        }
      } else if (step.provider === '0x') {
        // 0x returns transaction in buyTokenToEthRate or similar
        return {
          unsignedTx: {
            to: quote.to,
            data: quote.data,
            value: quote.value || '0',
            gas: quote.gas,
            gasPrice: quote.gasPrice,
            chainId: step.from.chainId,
          },
          requiresSignature: true,
        }
      }

      throw new Error(`Unsupported EVM provider: ${step.provider}`)
    }

    case 'SOLANA': {
      // Solana: Use Jupiter swap transaction
      if (step.provider !== 'jupiter') {
        throw new Error(`Unsupported Solana provider: ${step.provider}`)
      }

      const quote = step.quote
      if (!quote) {
        throw new Error('Quote missing for Solana step')
      }

      // Jupiter requires building the transaction from the quote
      // In production, you'd call Jupiter's swap API to get the transaction
      return {
        unsignedTx: {
          // Jupiter transaction structure
          transaction: quote.transaction || quote.swapTransaction,
          // User's public key
          userPublicKey: wallets.solana?.pubkey,
        },
        requiresSignature: true,
      }
    }

    case 'TON': {
      // TON: Build TonConnect transaction request
      if (step.kind === 'OFFCHAIN_SWAP') {
        // Off-chain swap instructions
        return {
          unsignedTx: {
            type: 'offchain_swap',
            instructions: {
              depositAddress: step.quote?.depositAddress,
              memo: step.quote?.memo,
              network: step.to.networkId,
            },
          },
          requiresSignature: false, // Off-chain doesn't need signature
        }
      }

      // On-chain TON transaction
      return {
        unsignedTx: {
          type: 'ton_transaction',
          to: step.to.tokenAddress,
          amount: step.amountInBase,
          // TON-specific transaction structure
        },
        requiresSignature: true,
      }
    }

    case 'TRON': {
      // TRON: Build TronLink compatible transaction
      if (step.kind === 'OFFCHAIN_SWAP') {
        return {
          unsignedTx: {
            type: 'offchain_swap',
            instructions: {
              depositAddress: step.quote?.depositAddress,
              memo: step.quote?.memo,
              network: step.to.networkId,
            },
          },
          requiresSignature: false,
        }
      }

      // Tron transaction structure
      return {
        unsignedTx: {
          type: 'tron_transaction',
          contract_address: step.to.tokenAddress,
          function_selector: 'transfer(address,uint256)',
          parameter: step.amountInBase,
          owner_address: wallets.tron?.address,
        },
        requiresSignature: true,
      }
    }

    default:
      throw new Error(`Unsupported family: ${step.family}`)
  }
}

/**
 * Create execution from route plan
 */
export async function createExecution(
  plan: RoutePlan,
  wallets: WalletContext
): Promise<Execution> {
  const executionId = generateExecutionId()

  // Build execution steps with unsigned transactions
  const steps: ExecutionStepState[] = []

  for (const step of plan.steps) {
    try {
      const { unsignedTx, requiresSignature } = await buildUnsignedTx(step, wallets)
      
      steps.push({
        stepId: step.id,
        state: requiresSignature ? 'SIGN_REQUIRED' : 'PENDING',
        unsignedTx,
      })
    } catch (error) {
      steps.push({
        stepId: step.id,
        state: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const execution: Execution = {
    id: executionId,
    planId: plan.id,
    plan,
    steps,
    currentStepIndex: 0,
    state: steps.length > 0 && steps[0].state === 'SIGN_REQUIRED' ? 'SIGN_REQUIRED' : 'PENDING',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  executionStore.set(executionId, execution)

  if (isDev) {
    console.log('[execution] Created execution:', {
      executionId,
      planId: plan.id,
      steps: steps.length,
    })
  }

  return execution
}

/**
 * Get execution by ID
 */
export function getExecution(executionId: string): Execution | null {
  return executionStore.get(executionId) || null
}

/**
 * Update execution step state
 */
export function updateStepState(
  executionId: string,
  stepId: string,
  state: ExecutionState,
  txHash?: string,
  error?: string
): boolean {
  const execution = executionStore.get(executionId)
  if (!execution) {
    return false
  }

  const step = execution.steps.find((s) => s.stepId === stepId)
  if (!step) {
    return false
  }

  step.state = state
  if (txHash) step.txHash = txHash
  if (error) step.error = error
  execution.updatedAt = Date.now()

  // Update overall execution state
  const allCompleted = execution.steps.every((s) => s.state === 'COMPLETED')
  const anyFailed = execution.steps.some((s) => s.state === 'FAILED')
  
  if (allCompleted) {
    execution.state = 'COMPLETED'
  } else if (anyFailed) {
    execution.state = 'FAILED'
  } else {
    // Check if we're waiting for signature or if a transaction is submitted
    const currentStep = execution.steps[execution.currentStepIndex]
    if (currentStep) {
      if (currentStep.state === 'SIGN_REQUIRED') {
        execution.state = 'SIGN_REQUIRED'
      } else if (currentStep.state === 'SUBMITTED' || currentStep.state === 'CONFIRMED') {
        execution.state = currentStep.state
      }
    }
  }

  executionStore.set(executionId, execution)
  return true
}

/**
 * Poll execution status (check blockchain for confirmation)
 */
export async function pollExecutionStatus(executionId: string): Promise<Execution | null> {
  const execution = getExecution(executionId)
  if (!execution) {
    return null
  }

  // Poll blockchain for each submitted step
  for (const stepState of execution.steps) {
    if (stepState.state === 'SUBMITTED' && stepState.txHash) {
      const step = execution.plan.steps.find((s) => s.id === stepState.stepId)
      if (!step) continue

      try {
        const confirmed = await checkTransactionStatus(stepState.txHash, step.from.family, step.from.chainId)
        
        if (confirmed) {
          updateStepState(executionId, stepState.stepId, 'CONFIRMED', stepState.txHash)
          
          // If confirmed, move to next step if needed
          if (stepState.stepId === execution.steps[execution.currentStepIndex].stepId) {
            execution.currentStepIndex++
            if (execution.currentStepIndex < execution.steps.length) {
              execution.state = 'SIGN_REQUIRED'
            }
          }
        }
      } catch (error) {
        if (isDev) {
          console.error(`[execution] Error polling step ${stepState.stepId}:`, error)
        }
      }
    }
  }

  return getExecution(executionId)
}

/**
 * Check transaction status on blockchain
 */
async function checkTransactionStatus(
  txHash: string,
  family: Family,
  chainId?: number | null
): Promise<boolean> {
  try {
    switch (family) {
      case 'EVM': {
        // Use RPC to check transaction receipt
        // This is a simplified version - in production use proper RPC client
        const rpcUrl = process.env[`RPC_URL_${chainId}`] || `https://rpc.ankr.com/eth`
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        })

        const data = await response.json()
        return data.result && data.result.status === '0x1'
      }

      case 'SOLANA': {
        // Check Solana transaction status
        const response = await fetch(`https://api.mainnet-beta.solana.com`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignatureStatuses',
            params: [[txHash]],
          }),
        })

        if (!response.ok) {
          return false
        }

        const data = await response.json()
        const status = data.result?.value?.[0]?.confirmationStatus
        return status === 'finalized' || status === 'confirmed'
      }

      case 'TON': {
        // Check TON transaction status via TonAPI
        const apiKey = getEnvWithDefault('TON_API_KEY', '')
        const response = await fetch(`https://tonapi.io/v2/blockchain/transactions/${txHash}`, {
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
        })

        return response.ok
      }

      case 'TRON': {
        // Check TRON transaction status via TronGrid
        const apiKey = getEnvWithDefault('TRONGRID_API_KEY', '')
        const response = await fetch(`https://api.trongrid.io/v1/transactions/${txHash}`, {
          headers: apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {},
        })

        const data = await response.json()
        return data.success === true && data.data?.[0]?.ret?.[0]?.contractRet === 'SUCCESS'
      }

      default:
        return false
    }
  } catch (error) {
    if (isDev) {
      console.error(`[execution] Error checking transaction ${txHash}:`, error)
    }
    return false
  }
}

