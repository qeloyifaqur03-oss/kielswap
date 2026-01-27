# Vercel Deployment Setup Guide

This document provides exact instructions for configuring Vercel projects for the Kielswap monorepo.

---

## Project Structure

The monorepo contains three projects:
- `/landing` - Next.js 14 landing page
- `/app` - Next.js 14 main application
- `/docs` - Mintlify documentation (hosted on Mintlify platform, not Vercel)

---

## Landing Project Configuration

### Vercel Dashboard Settings

1. **Framework Preset**: Next.js
2. **Root Directory**: `landing`
3. **Build Command**: `pnpm run build`
4. **Install Command**: `pnpm install --frozen-lockfile`
5. **Output Directory**: `.next` (default)

### Environment Variables

**Server-only (no NEXT_PUBLIC prefix):**
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token
- `COINMARKETCAP_API_KEY` - (Optional) CoinMarketCap API key for price fallback

**Client-side (NEXT_PUBLIC prefix):**
- `NEXT_PUBLIC_LANDING_URL` - (Optional) Landing page URL for cross-domain links
- `NEXT_PUBLIC_DEBUG_BOOT` - (Optional) Set to "1" for debug logging
- `NEXT_PUBLIC_DEBUG_WALLET` - (Optional) Set to "1" for wallet debug logging

---

## App Project Configuration

### Vercel Dashboard Settings

1. **Framework Preset**: Next.js
2. **Root Directory**: `app`
3. **Build Command**: `pnpm run build`
4. **Install Command**: `pnpm install --frozen-lockfile`
5. **Output Directory**: `.next` (default)

### Environment Variables

**Server-only (no NEXT_PUBLIC prefix):**
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token
- `COINMARKETCAP_API_KEY` - (Optional) CoinMarketCap API key for price fallback
- `RELAY_DEBUG` - (Optional) Set to "true" for Relay provider debugging
- `DEBUG_QUOTES` - (Optional) Set to "1" for quote debugging

**Client-side (NEXT_PUBLIC prefix):**
- `NEXT_PUBLIC_LANDING_URL` - Landing page URL (e.g., "https://kielswap.com")
- `NEXT_PUBLIC_DEBUG_BOOT` - (Optional) Set to "1" for debug logging
- `NEXT_PUBLIC_DEBUG_WALLET` - (Optional) Set to "1" for wallet debug logging
- `NEXT_PUBLIC_DEBUG_QUOTES` - (Optional) Set to "1" for quote debugging

---

## Docs Project

**Decision**: Docs should be hosted on Mintlify platform, not Vercel.

**Reason**: 
- Mintlify is a specialized documentation platform
- Better integration with `mint.json` configuration
- Automatic updates from Git
- No build configuration needed

**Setup on Mintlify**:
1. Connect GitHub repository
2. Set root directory to `docs`
3. Mintlify will automatically detect `mint.json` and deploy

---

## Important Notes

### Lockfile
- Ensure `pnpm-lock.yaml` is committed to the repository
- Vercel will use `--frozen-lockfile` to ensure deterministic installs

### Build Artifacts
- Never commit `.next`, `node_modules`, or `.vercel` directories
- These are automatically ignored via `.gitignore`

### Permissions
- Both projects have `prebuild` scripts that fix Next.js binary permissions
- This is required for Vercel's build environment

### Monorepo Considerations
- Vercel installs dependencies at the repository root due to pnpm workspaces
- Each project's build runs in its own root directory context
- This is handled automatically by Vercel when Root Directory is set correctly

---

## Verification Checklist

After deployment, verify:

- [ ] Landing project builds successfully
- [ ] App project builds successfully
- [ ] All routes are accessible (no 404s)
- [ ] Environment variables are set correctly
- [ ] API routes respond correctly
- [ ] No console errors in production

---

**Vercel Setup Complete** ✅
