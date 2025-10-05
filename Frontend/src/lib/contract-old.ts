// Web3 Time Capsule Contract Types and Mock Data

export interface TimeCapsule {
  id: string;
  creator: string;
  title: string;
  description: string;
  unlockTime: number;
  recipients: string[];
  contentHash: string;
  encryptedKey: string;
  status: 'locked' | 'unlocked';
  createdAt: number;
  contentTypes: string[];
}

export interface CreateCapsuleParams {
  title: string;
  description: string;
  unlockTime: number;
  recipients: string[];
  contentHash: string;
  encryptedKey: string;
}

// Real TimeCapsule Contract Integration with Wagmi/Viem
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, Address } from 'viem';
import { CONTRACT_ADDRESS } from '../config/contracts';
import { TIME_CAPSULE_ABI } from '../config/abi';

// Type definitions for our contract
export interface Capsule {
  id: string;
  creator: string;
  title: string;
  description: string;
  ipfsHash: string;
  unlockTime: number;
  createdAt: number;
  isUnlocked: boolean;
  isRevealed: boolean;
  visibility: 0 | 1 | 2; // 0 = Private, 1 = Public, 2 = Friends
}

export interface CreateCapsuleParams {
  title: string;
  description: string;
  content: string;
  unlockDate: Date;
  visibility: 'private' | 'public' | 'friends';
  recipients?: string[];
}

// Contract interaction hooks for reading data
export function useProtocolFee() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'protocolFee',
  });
}

export function useTotalCapsules() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'totalCapsules',
  });
}

export function useUserCapsules(userAddress?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'getUserCapsules',
    args: userAddress ? [userAddress] : undefined,
  });
}

export function useCapsuleDetails(capsuleId: string) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'getCapsule',
    args: capsuleId ? [BigInt(capsuleId)] : undefined,
  });
}

// Simplified contract class for complex operations
export class TimeCapsuleContract {
  
  // Create a new time capsule
  async createCapsule(params: CreateCapsuleParams): Promise<string> {
    // For now, mock the creation until we integrate the write hooks properly
    const capsuleId = Date.now().toString();
    
    console.log('Creating capsule with params:', params);
    console.log('Would call smart contract createCapsule function');
    console.log('Contract address:', CONTRACT_ADDRESS);
    
    // TODO: Replace with actual contract call using useWriteContract
    // This is a transitional implementation
    
    return capsuleId;
  }

  // Get user's capsules (mock for backward compatibility)
  async getUserCapsules(userAddress?: string): Promise<Capsule[]> {
    // TODO: Use useUserCapsules hook result
    console.log('Getting user capsules for:', userAddress);
    return [];
  }

  // Get single capsule (mock for backward compatibility)
  async getCapsule(id: string): Promise<Capsule | null> {
    // TODO: Use useCapsuleDetails hook result
    console.log('Getting capsule:', id);
    return null;
  }

  // Unlock a capsule
  async unlockCapsule(id: string): Promise<void> {
    console.log('Would unlock capsule:', id);
    // TODO: Implement with useWriteContract
  }

  // Reveal a capsule
  async revealCapsule(id: string): Promise<string | null> {
    console.log('Would reveal capsule:', id);
    // TODO: Implement with useWriteContract
    return null;
  }

  // Get protocol fee
  async getProtocolFee(): Promise<string> {
    return "0.001"; // Mock fee for now
  }
}

// Export singleton instance for backward compatibility
export const timeCapsuleContract = new TimeCapsuleContract();

// Export contract configuration
export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: TIME_CAPSULE_ABI,
} as const;

// Write contract hooks for transactions
export function useCreateCapsule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const createCapsule = async (params: CreateCapsuleParams) => {
    const visibilityMap = { private: 0, public: 1, friends: 2 } as const;
    const visibility = visibilityMap[params.visibility];
    const unlockTime = BigInt(Math.floor(params.unlockDate.getTime() / 1000));
    const ipfsHash = `mock_${Date.now()}`;
    const protocolFee = parseEther('0.001');
    
    console.log('Creating capsule on blockchain...');
    
    // TODO: Fix TypeScript issues and uncomment
    // return writeContract({
    //   address: CONTRACT_ADDRESS,
    //   abi: TIME_CAPSULE_ABI,
    //   functionName: 'createCapsule',
    //   args: [params.title, params.description, ipfsHash, unlockTime, visibility],
    //   value: protocolFee,
    // });
    
    return Promise.resolve(Date.now().toString());
  };
  
  return { createCapsule, hash, error, isPending };
}
class TimeCapsuleContract {
  private mockCapsules: TimeCapsule[] = [
    {
      id: '0x1',
      creator: '0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7',
      title: 'Memories from 2024',
      description: 'A collection of photos and thoughts from this year',
      unlockTime: new Date('2025-01-15').getTime() / 1000,
      recipients: ['0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7'],
      contentHash: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o',
      encryptedKey: 'encrypted-aes-key-here',
      status: 'locked',
      createdAt: new Date('2024-01-15').getTime() / 1000,
      contentTypes: ['images', 'text'],
    },
    {
      id: '0x2',
      creator: '0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7',
      title: 'Future Goals',
      description: 'My aspirations and plans for the next 5 years',
      unlockTime: new Date('2029-03-20').getTime() / 1000,
      recipients: ['0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7'],
      contentHash: 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB',
      encryptedKey: 'encrypted-aes-key-here-2',
      status: 'locked',
      createdAt: new Date('2024-03-20').getTime() / 1000,
      contentTypes: ['text', 'documents'],
    },
    {
      id: '0x3',
      creator: '0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7',
      title: 'Family Time',
      description: 'Special moments with loved ones',
      unlockTime: new Date('2024-06-10').getTime() / 1000,
      recipients: ['0x742d35Cc6493C0532a04D8B2345EDD8eb0b6b5b7'],
      contentHash: 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51',
      encryptedKey: 'encrypted-aes-key-here-3',
      status: 'unlocked',
      createdAt: new Date('2023-06-10').getTime() / 1000,
      contentTypes: ['images', 'video'],
    },
  ];

  async createCapsule(params: CreateCapsuleParams, userAddress: string): Promise<string> {
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newCapsule: TimeCapsule = {
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      creator: userAddress,
      title: params.title,
      description: params.description,
      unlockTime: params.unlockTime,
      recipients: params.recipients,
      contentHash: params.contentHash,
      encryptedKey: params.encryptedKey,
      status: 'locked',
      createdAt: Math.floor(Date.now() / 1000),
      contentTypes: ['text'], // This would be determined by the uploaded content
    };

    this.mockCapsules.push(newCapsule);
    return newCapsule.id;
  }

  async getCapsule(id: string): Promise<TimeCapsule | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockCapsules.find(capsule => capsule.id === id) || null;
  }

  async getUserCapsules(userAddress: string): Promise<TimeCapsule[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockCapsules.filter(
      capsule => 
        capsule.creator.toLowerCase() === userAddress.toLowerCase() ||
        capsule.recipients.some(recipient => 
          recipient.toLowerCase() === userAddress.toLowerCase()
        )
    );
  }

  async canUnlock(id: string, userAddress: string): Promise<boolean> {
    const capsule = await this.getCapsule(id);
    if (!capsule) return false;
    
    const isRecipient = capsule.recipients.some(recipient => 
      recipient.toLowerCase() === userAddress.toLowerCase()
    );
    const isUnlockTime = Date.now() / 1000 >= capsule.unlockTime;
    
    return isRecipient && isUnlockTime;
  }
}

// Singleton instance
export const timeCapsuleContract = new TimeCapsuleContract();

// Contract addresses for footer
export const CONTRACT_ADDRESSES = {
  TimeCapsule: '0x0000000000000000000000000000000000000000', // Placeholder
  baseSepolia: {
    TimeCapsule: '0x0000000000000000000000000000000000000000', // Placeholder
    blockExplorer: 'https://sepolia.basescan.org',
  },
};