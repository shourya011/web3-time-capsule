// ENS Utilities

import { normalize } from 'viem/ens';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`,
    });
    return ensName;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

export async function resolveEnsAddress(name: string): Promise<string | null> {
  try {
    const normalizedName = normalize(name);
    const address = await publicClient.getEnsAddress({
      name: normalizedName,
    });
    return address;
  } catch (error) {
    console.error('Error resolving ENS address:', error);
    return null;
  }
}

export function formatAddress(address: string, ensName?: string | null): string {
  if (ensName) {
    return ensName;
  }
  
  if (!address) return '';
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidEnsName(name: string): boolean {
  return name.endsWith('.eth') && name.length > 4;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}