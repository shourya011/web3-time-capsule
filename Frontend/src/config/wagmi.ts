import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Time Capsule',
  projectId: 'your-walletconnect-project-id', // Replace with your WalletConnect project ID
  chains: [baseSepolia, mainnet],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

export const defaultChain = baseSepolia;