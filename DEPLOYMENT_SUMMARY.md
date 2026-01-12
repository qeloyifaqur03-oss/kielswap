# Deployment Hardening Summary

**Date:** 2025-01-27  
**Status:** ✅ COMPLETE

## Final Status

- **landing build: PASS** (exit code 0)
- **app build: PASS** (exit code 0)
- **docs: Mintlify hosting** (not deployed via Vercel)

## Changed Files

### 1. Root Configuration
- **`package.json`**: Added `pnpm.overrides` with `"viem": "2.44.1"` for workspace-wide version consistency

### 2. Shared Package
- **`packages/lib/package.json`** (NEW): Created package.json with dependencies:
  - `@upstash/redis`: "^1.36.1"
  - `clsx`: "^2.1.1"
  - `tailwind-merge`: "^3.4.0"
  - `wagmi`: "^2.19.5"
  - `viem`: "^2.44.1"
  
  **Note**: `packages/lib` is used via relative imports (`../../packages/lib/lib/...`), not as an npm package. The package.json is needed for TypeScript module resolution during build. This is safe and does not create duplicate dependencies since pnpm workspace hoisting handles it correctly.

### 3. Token Price API Routes (Build-Time Network Call Fixes)
- **`landing/app/api/token-price/route.ts`**:
  - Added robust build-time detection with multiple checks:
    - `process.env.NEXT_PHASE === 'phase-production-build'`
    - `process.env.VERCEL === '1'` (catches Vercel builds)
    - `process.env.CI === 'true'` (catches CI environments)
    - `process.env.DISABLE_BUILD_TIME_FETCH === '1'` (explicit flag)
  - Skip all network calls (CoinGecko, CoinMarketCap, CryptoCompare) during build
  - Return empty prices object gracefully during build instead of throwing errors
  - Changed error logging to `console.warn` during build

- **`app/app/api/token-price/route.ts`**:
  - Same robust build-time detection as landing version

### 4. UI Protection Against Empty Prices
- **`landing/components/LandingSwapWidget.tsx`**:
  - Added guard against zero prices: `ethPrice <= 0 || usdtPrice <= 0`
  - Prevents division by zero in exchange rate calculation
  - Returns `null` for exchangeRate if prices are invalid

- **`landing/components/HowItWorks.tsx`**:
  - Added guard against zero prices: `ethPrice <= 0 || usdtPrice <= 0`
  - Prevents division by zero in exchange rate calculation
  - Returns `null` for exchangeRate if prices are invalid

- **`app/app/api/quote/route.ts`**:
  - Already has protection: `if (fromPrice && toPrice && fromPrice > 0 && toPrice > 0)` before division
  - No changes needed - protection already in place

### 4. Documentation
- **`DEPLOYMENT_HARDENING_REPORT.md`**: 
  - Updated date to 2025-01-27
  - Removed unverified "Verified" assertions
  - Added Phase 7: Build-Time Network Request Hardening section
  - Updated Final Status to reference DEPLOYMENT_PROOF.md

- **`DEPLOYMENT_PROOF.md`**: 
  - Complete rewrite with actual clean-slate build logs
  - Windows PowerShell proof with real command outputs
  - Exit codes and key build messages documented

## Commands for Launch

### Vercel Deployment

**Landing Project:**
- Root Directory: `landing`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`
- Framework Preset: Next.js

**App Project:**
- Root Directory: `app`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`
- Framework Preset: Next.js

### Local Verification

```powershell
# Clean build artifacts
Remove-Item -Recurse -Force node_modules,landing\.next,app\.next -ErrorAction SilentlyContinue

# Install dependencies
pnpm install

# Build projects
pnpm -C landing build
pnpm -C app build
```

## Environment Variables (Vercel)

### Landing Project

**Server-only:**
- `UPSTASH_REDIS_REST_URL` (optional - build works without it)
- `UPSTASH_REDIS_REST_TOKEN` (optional - build works without it)
- `COINMARKETCAP_API_KEY` (optional)
- `DISABLE_BUILD_TIME_FETCH` (optional - set to `1` to explicitly disable build-time network calls)

**Client-side:**
- `NEXT_PUBLIC_LANDING_URL` (optional)
- `NEXT_PUBLIC_DEBUG_BOOT` (optional)
- `NEXT_PUBLIC_DEBUG_WALLET` (optional)

### App Project

**Server-only:**
- `UPSTASH_REDIS_REST_URL` (optional - build works without it)
- `UPSTASH_REDIS_REST_TOKEN` (optional - build works without it)
- `COINMARKETCAP_API_KEY` (optional)
- `RELAY_DEBUG` (optional)
- `DEBUG_QUOTES` (optional)
- `DISABLE_BUILD_TIME_FETCH` (optional - set to `1` to explicitly disable build-time network calls)

**Client-side:**
- `NEXT_PUBLIC_LANDING_URL`
- `NEXT_PUBLIC_DEBUG_BOOT` (optional)
- `NEXT_PUBLIC_DEBUG_WALLET` (optional)
- `NEXT_PUBLIC_DEBUG_QUOTES` (optional)

**Note**: Build-time network calls are automatically disabled when:
- `NEXT_PHASE === 'phase-production-build'` (Next.js build phase)
- `VERCEL === '1'` (Vercel environment)
- `CI === 'true'` (CI environment)
- `DISABLE_BUILD_TIME_FETCH === '1'` (explicit flag)

## Risks

1. **Type assertions (`as any`)**: Still present in `landing/components/Providers.tsx`, `app/components/Providers.tsx`, and `packages/lib/lib/wagmi/config.ts` due to viem/wagmi version conflicts. The `pnpm.overrides` should help, but type assertions remain as a safety measure. TODO: Consider removing after verifying builds pass consistently.

2. **WagmiProvider warnings**: During static generation, WagmiProvider warnings may appear but are caught and handled gracefully. This is expected behavior and does not affect build success.

3. **Shared package dependencies**: `packages/lib/package.json` was created to resolve module resolution issues. Since `packages/lib` is used via relative imports (not as npm package), the package.json is primarily for TypeScript resolution. pnpm workspace hoisting prevents duplicate dependencies, but ensure all future dependencies used by packages/lib are added to this file.

4. **Empty prices handling**: UI components are protected against empty/zero prices with guards (`price <= 0` checks). The quote API route already has protection before division operations. All price calculations return `null` or safe defaults when prices are unavailable.

## Verification

All changes have been verified with clean-slate builds:
- ✅ `pnpm install` completes successfully
- ✅ `pnpm -C landing build` passes (exit code 0)
- ✅ `pnpm -C app build` passes (exit code 0)
- ✅ No build-time network call errors
- ✅ No TypeScript compilation errors

See `DEPLOYMENT_PROOF.md` for complete build logs.
