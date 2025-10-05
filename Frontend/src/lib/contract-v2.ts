// Real TimeCapsule Contract Integration with Wagmi/Viem
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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

// Contract interaction hooks

// Hook to read protocol fee
export function useProtocolFee() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'protocolFee',
  });
}

// Hook to read total capsules
export function useTotalCapsules() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'totalCapsules',
  });
}

// Hook to get user's capsules
export function useUserCapsules(userAddress?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'getUserCapsules',
    args: userAddress ? [userAddress] : undefined,
  });
}

// Hook to get capsule details
export function useCapsuleDetails(capsuleId: string) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TIME_CAPSULE_ABI,
    functionName: 'getCapsule',
    args: capsuleId ? [BigInt(capsuleId)] : undefined,
  });
}

// Simplified contract interaction class for complex operations
export class TimeCapsuleContract {
  
  async createCapsule(params: CreateCapsuleParams, writeContract: any) {
    // Convert visibility string to number
    const visibilityMap = { private: 0, public: 1, friends: 2 } as const;
    const visibility = visibilityMap[params.visibility];
    
    // Convert unlock date to timestamp
    const unlockTime = BigInt(Math.floor(params.unlockDate.getTime() / 1000));
    
    // For now, use content as IPFS hash (should be uploaded to IPFS first)
    const ipfsHash = `mock_${Date.now()}`; // Replace with actual IPFS upload
    
    // Get protocol fee (mock for now)
    const protocolFee = parseEther('0.001');
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: TIME_CAPSULE_ABI,
      functionName: 'createCapsule',
      args: [
        params.title,
        params.description,
        ipfsHash,
        unlockTime,
        visibility,
      ],
      value: protocolFee,
    });
  }

  async unlockCapsule(capsuleId: string, writeContract: any) {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: TIME_CAPSULE_ABI,
      functionName: 'unlockCapsule',
      args: [BigInt(capsuleId)],
    });
  }

  async revealCapsule(capsuleId: string, writeContract: any) {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: TIME_CAPSULE_ABI,
      functionName: 'revealCapsule',
      args: [BigInt(capsuleId)],
    });
  }

  // Helper method to get user capsules (for backward compatibility)
  async getUserCapsules(userAddress?: string): Promise<Capsule[]> {
    // This should be handled by the useUserCapsules hook in components
    // Returning empty array for now - real implementation would use contract data
    return [];
  }

  async getCapsule(id: string): Promise<Capsule | null> {
    // This should be handled by the useCapsuleDetails hook in components
    // Returning null for now - real implementation would use contract data
    return null;
  }

  async getProtocolFee(): Promise<string> {
    return "0.001"; // Mock fee for backward compatibility
  }
}

// Export singleton instance for backward compatibility
export const timeCapsuleContract = new TimeCapsuleContract();

// Export contract configuration for direct usage
export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: TIME_CAPSULE_ABI,
} as const;

// Hook for creating capsules with better error handling
export function useCreateCapsule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const createCapsule = async (params: CreateCapsuleParams) => {
    return timeCapsuleContract.createCapsule(params, writeContract);
  };
  
  return {
    createCapsule,
    hash,
    error,
    isPending,
  };
}

// Hook for unlocking capsules
export function useUnlockCapsule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const unlockCapsule = async (capsuleId: string) => {
    return timeCapsuleContract.unlockCapsule(capsuleId, writeContract);
  };
  
  return {
    unlockCapsule,
    hash,
    error,
    isPending,
  };
}

// Hook for revealing capsules
export function useRevealCapsule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const revealCapsule = async (capsuleId: string) => {
    return timeCapsuleContract.revealCapsule(capsuleId, writeContract);
  };
  
  return {
    revealCapsule,
    hash,
    error,
    isPending,
  };
}

// Hook to wait for transaction confirmation
export function useTransactionReceipt(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}