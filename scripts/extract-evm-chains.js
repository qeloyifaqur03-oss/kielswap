const fs = require('fs');
const path = require('path');

const chainRegistry = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../lib/data/chain_registry_full.json'), 'utf8')
);

// Extract all EVM chains
const evmChains = chainRegistry
  .filter(c => c.flags?.EVM === true && c.identifiers?.chainId !== null && c.identifiers?.chainId !== undefined)
  .map(c => {
    const shortName = c.extra?.shortName || c.key;
    const displayName = c.name || c.key;
    return {
      key: c.key,
      name: displayName,
      shortName: shortName,
      chainId: c.identifiers.chainId,
      symbol: c.nativeAsset?.symbol || 'ETH',
      logo: c.nativeAsset?.logo || null,
    };
  })
  .sort((a, b) => a.chainId - b.chainId);

console.log(JSON.stringify(evmChains, null, 2));

















