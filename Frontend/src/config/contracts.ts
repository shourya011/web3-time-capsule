import { Address } from 'viem';

// Contract deployment addresses per network
export const CONTRACT_ADDRESSES = {
  // Local Hardhat network
  localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Replace after deployment
  
  // Base Sepolia testnet  
  baseSepolia: '0x742D35CC6639c10532bfeD48C4F4B8a2C857fD3E' as Address, // TimeCapsule contract deployed on Base Sepolia
  
  // Base mainnet (for production)
  base: '0x...' as Address, // Replace when deploying to mainnet
} as const;

// Current network configuration
export const CURRENT_NETWORK = 'baseSepolia'; // Using Base Sepolia testnet with deployed contract

// Get contract address for current network
export const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];

// Chain IDs
export const CHAIN_IDS = {
  localhost: 31337,
  baseSepolia: 84532,
  base: 8453,
} as const;

export const CURRENT_CHAIN_ID = CHAIN_IDS[CURRENT_NETWORK];

console.log(`🌐 Using ${CURRENT_NETWORK} network`);
console.log(`📄 Contract address: ${CONTRACT_ADDRESS}`);