'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface RouteDetailsProps {
  fromNetwork?: string
  fromToken?: string
  toNetwork?: string
  toToken?: string
  fees?: string | null // Legacy field
  estimatedTime?: string | null
  routeConfidence?: string | null
  executionStatus?: string
  // Fee breakdown fields
  estimatedGasUSD?: string | null
  providerFeeUSD?: string | null
  bridgeFeeUSD?: string | null
  totalFeeUSD?: string | null
}

export function RouteDetails({
  fromNetwork,
  fromToken,
  toNetwork,
  toToken,
  fees,
  estimatedTime,
  routeConfidence,
  executionStatus = 'Ready',
  estimatedGasUSD,
  providerFeeUSD,
  bridgeFeeUSD,
  totalFeeUSD,
}: RouteDetailsProps) {
  const [feesExpanded, setFeesExpanded] = useState(false)
  
  // Format USD value, showing "—" if null/undefined
  const formatUSD = (value: string | null | undefined): string => {
    if (!value || value === '0' || parseFloat(value) === 0) return '—'
    const num = parseFloat(value)
    if (isNaN(num)) return '—'
    // Show 2 decimal places, but remove trailing zeros
    return `$${num.toFixed(2).replace(/\.?0+$/, '')}`
  }

  // Check if we have any fee breakdown data
  const hasFeeBreakdown = estimatedGasUSD || providerFeeUSD || bridgeFeeUSD || totalFeeUSD

  return (
    <div className="pt-4 space-y-4">
      {/* Group 1: Pair summary (stacked) */}
      <div className="space-y-1.5">
        {fromNetwork && fromToken && (
          <div className="text-xs text-gray-500 font-light">
            From: <span className="text-gray-300">{fromNetwork} {fromToken}</span>
          </div>
        )}
        {toNetwork && toToken && (
          <div className="text-xs text-gray-500 font-light">
            To: <span className="text-gray-300">{toNetwork} {toToken}</span>
          </div>
        )}
      </div>

      {/* Group 2: Metrics (2-column grid) */}
      {(fees || estimatedTime || routeConfidence || executionStatus) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
          {/* Total fees (legacy) */}
          {fees && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-500 font-light">Total fees</div>
              <div className="text-sm text-gray-300 font-light">
                {fees}
              </div>
            </div>
          )}

          {/* Estimated time */}
          {estimatedTime && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-500 font-light">Estimated time</div>
              <div className="text-sm text-gray-300 font-light">
                {estimatedTime}
              </div>
            </div>
          )}

          {/* Route confidence */}
          {routeConfidence && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-500 font-light">Route confidence</div>
              <div className="text-sm text-gray-300 font-light">
                {routeConfidence}
              </div>
            </div>
          )}

          {/* Execution status */}
          {executionStatus && (
            <div className="space-y-0.5">
              <div className="text-xs text-gray-500 font-light">Execution status</div>
              <div className="text-sm text-gray-300 font-light">
                {executionStatus}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fee breakdown (collapsible) */}
      {hasFeeBreakdown && (
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => setFeesExpanded(!feesExpanded)}
            className="w-full flex items-center justify-between py-2 text-xs text-gray-400 font-light hover:text-gray-300 transition-colors"
          >
            <span>Fee breakdown</span>
            {feesExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {feesExpanded && (
            <div className="space-y-2.5 pt-2">
              {/* Platform fee - always $0 */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-light">Platform fee</span>
                <span className="text-gray-300 font-medium">$0</span>
              </div>

              {/* Network gas (est.) */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-light">Network gas (est.)</span>
                <span className="text-gray-300 font-light">{formatUSD(estimatedGasUSD)}</span>
              </div>

              {/* Provider/bridge fees */}
              {(providerFeeUSD || bridgeFeeUSD) && (
                <>
                  {providerFeeUSD && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-light">Provider fees</span>
                      <span className="text-gray-300 font-light">{formatUSD(providerFeeUSD)}</span>
                    </div>
                  )}
                  {bridgeFeeUSD && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-light">Bridge fees</span>
                      <span className="text-gray-300 font-light">{formatUSD(bridgeFeeUSD)}</span>
                    </div>
                  )}
                </>
              )}

              {/* Total fees */}
              {totalFeeUSD && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-gray-400 font-medium">Total fees</span>
                  <span className="text-gray-300 font-medium">{formatUSD(totalFeeUSD)}</span>
                </div>
              )}

              {/* Note */}
              <div className="pt-1">
                <div className="text-xs text-gray-500 font-light italic">
                  Zero platform fees. Network and provider fees may still apply.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

