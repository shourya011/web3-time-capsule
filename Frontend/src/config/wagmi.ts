import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Time Capsule',
  projectId: 'your-walletconnect-project-id', // Replace with your WalletConnect project ID
  chains: [baseSepolia, mainnet],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

export const defaultChain = baseSepolia;

// Utility function to clear all wallet-related storage
export const clearWalletStorage = () => {
  // Clear localStorage items related to wagmi and rainbowkit
  const keysToRemove = [
    'wagmi.wallet',
    'wagmi.connected',
    'wagmi.cache',
    'wagmi.store',
    'rainbowkit.recent',
    'walletconnect',
    'wc@2:core:pairing',
    'wc@2:client:0.3//session',
    'wc@2:client:0.3//proposal',
    'wc@2:client:0.3//request',
    'wc@2:ethereum_provider:session',
    'metamask-onboarding',
  ];
  
  // Remove specific keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Remove any keys that start with wagmi or wc
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('wagmi') || key.startsWith('wc') || key.startsWith('rainbowkit')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage
  sessionStorage.clear();
};