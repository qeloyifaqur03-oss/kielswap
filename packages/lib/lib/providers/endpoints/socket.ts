/**
 * Socket Protocol API endpoints
 * Socket aggregates multiple bridge providers (Hop, Across, Synapse, cBridge, etc.)
 * Documentation: https://docs.socket.tech/
 */

export const SOCKET_ENDPOINTS = {
  quote: 'https://api.socket.tech/v2/quote',
  buildTx: 'https://api.socket.tech/v2/build-tx',
  status: 'https://api.socket.tech/v2/status',
  supportedChains: 'https://api.socket.tech/v2/supported/chains',
  supportedTokens: 'https://api.socket.tech/v2/supported/tokens',
} as const














