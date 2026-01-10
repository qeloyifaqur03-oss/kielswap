import { NextRequest, NextResponse } from 'next/server'
import { isAddress, getAddress } from 'viem'

export const runtime = 'nodejs'

/**
 * POST /api/badges/claim
 * Claims a badge with wallet address validation and eligibility check
 * 
 * HARD REQUIREMENT: Address must be provided and valid
 * 
 * NOTE: Eligibility is computed client-side (localStorage-based).
 * This endpoint validates address format and provides server-side record.
 * In a production system, eligibility would be computed server-side from a database.
 * 
 * This endpoint is idempotent: if badge is already claimed, returns success with claimed=true.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { badgeId, address } = body

    // HARD REQUIREMENT: Address must be provided
    if (!address) {
      return NextResponse.json({
        ok: false,
        error: 'wallet address is required',
        errorCode: 'MISSING_ADDRESS',
      }, { status: 400 })
    }

    // Validate required fields
    if (!badgeId) {
      return NextResponse.json({
        ok: false,
        error: 'missing required field: badgeId',
        errorCode: 'MISSING_FIELDS',
      }, { status: 400 })
    }

    // Validate address format (must be valid EVM address)
    if (!isAddress(address)) {
      return NextResponse.json({
        ok: false,
        error: 'invalid address format',
        errorCode: 'INVALID_ADDRESS',
      }, { status: 400 })
    }

    const checksumAddress = getAddress(address)

    // NOTE: Eligibility check is handled client-side (localStorage-based).
    // The client-side claimByClick() already validates eligibility before calling this endpoint.
    // 
    // In production, this would query a database to:
    // 1. Check if badge is eligible for this address (volume, access, etc.)
    // 2. Check if badge is already claimed (idempotency)
    // 3. Mark badge as claimed in persistent storage
    //
    // For MVP, we trust client-side eligibility validation and return success.
    // The actual claim state is stored client-side in localStorage.
    //
    // In production, add server-side eligibility check here:
    // if (!isEligibleServerSide(address, badgeId)) {
    //   return NextResponse.json({
    //     ok: false,
    //     error: 'badge not eligible',
    //     errorCode: 'NOT_ELIGIBLE',
    //   }, { status: 403 })
    // }

    // Idempotent: if already claimed (checked client-side), return success
    // In production, check database: if (alreadyClaimed) return { ok: true, claimed: true }

    return NextResponse.json({
      ok: true,
      badgeId,
      address: checksumAddress,
      claimed: true,
    })
  } catch (error) {
    console.error('[badges/claim] Error:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    }, { status: 500 })
  }
}
