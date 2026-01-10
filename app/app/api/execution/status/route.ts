/**
 * Execution status polling endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getExecution, pollExecutionStatus, updateStepState } from '@/lib/execution/orchestrator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('executionId')

    if (!executionId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing executionId parameter',
          errorCode: 'MISSING_EXECUTION_ID',
        },
        { status: 400 }
      )
    }

    // Check for txHash update (if client submitted transaction)
    const txHash = searchParams.get('txHash')
    const stepId = searchParams.get('stepId')
    
    if (txHash && stepId) {
      updateStepState(executionId, stepId, 'SUBMITTED', txHash)
    }

    // Poll for updated status
    const execution = await pollExecutionStatus(executionId)

    if (!execution) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Execution not found',
          errorCode: 'EXECUTION_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const currentStep = execution.steps[execution.currentStepIndex]

    return NextResponse.json({
      ok: true,
      execution: {
        id: execution.id,
        planId: execution.planId,
        state: execution.state,
        currentStepIndex: execution.currentStepIndex,
        currentStep: currentStep ? {
          stepId: currentStep.stepId,
          state: currentStep.state,
          txHash: currentStep.txHash,
          unsignedTx: currentStep.unsignedTx,
          error: currentStep.error,
        } : null,
        steps: execution.steps.map((s) => ({
          stepId: s.stepId,
          state: s.state,
          txHash: s.txHash,
          error: s.error,
        })),
      },
    })
  } catch (error) {
    console.error('[execution-status] Error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'STATUS_ERROR',
      },
      { status: 500 }
    )
  }
}




















