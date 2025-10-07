// Real TimeCapsule Contract Integration with Wagmi/Viem + IPFS
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther, Address } from 'viem';
import { CONTRACT_ADDRESS } from '../config/contracts';
import { TIME_CAPSULE_ABI } from '../config/abi';
import { ipfsService, EncryptedCapsuleData } from './ipfs';
import { cryptoService } from './crypto';
import { BrowserBuffer } from './browserBuffer';

// Type definitions
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
  visibility: 0 | 1 | 2;
}

export interface CreateCapsuleParams {
  title: string;
  description: string;
  content: string;
  unlockDate: Date;
  visibility: 'private' | 'public' | 'friends';
  recipients?: string[];
}

export interface StoredRecoveryKit {
  key: string;
  iv: string;
  capsuleId: string;
  ipfsCid: string;
}

// Read hooks
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

// Write hooks
export function useCreateCapsule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const createCapsule = async (params: CreateCapsuleParams) => {
    try {
      console.log('🔐 Starting capsule creation with encryption and IPFS...');
      
      // Step 1: Encrypt the content
      const encryptedData = await cryptoService.encrypt(params.content);
      
      // Step 2: Prepare capsule data for IPFS
      const capsuleData: EncryptedCapsuleData = {
        title: params.title,
        description: params.description,
        content: BrowserBuffer.arrayBufferToBase64(encryptedData.encryptedContent),
        encryptedAt: Date.now(),
        metadata: {
          creator: 'unknown', // Will be set when user is connected
          createdAt: Date.now(),
          unlockTime: params.unlockDate.getTime(),
          visibility: params.visibility,
        }
      };
      
      // Step 3: Upload encrypted data to IPFS
      console.log('📦 Uploading to IPFS...');
      const ipfsResult = await ipfsService.uploadCapsule(capsuleData);
      console.log('✅ IPFS upload successful:', ipfsResult);
      
      // Step 4: Generate content hash for contract
      const contentHash = await crypto.subtle.digest('SHA-256', 
        new TextEncoder().encode(params.content)
      );
      const hashArray = Array.from(new Uint8Array(contentHash));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Step 5: Prepare contract parameters
      const visibilityMap = { private: 0, public: 1, friends: 2 } as const;
      const visibility = visibilityMap[params.visibility];
      const unlockTime = BigInt(Math.floor(params.unlockDate.getTime() / 1000));
      const protocolFee = parseEther('0.001');
      
      console.log('🔗 Creating capsule on blockchain with:', {
        title: params.title,
        contentHash: hashHex,
        ipfsCid: ipfsResult.cid,
        unlockTime: unlockTime.toString(),
        visibility,
        contractAddress: CONTRACT_ADDRESS
      });
      
      // Step 6: Store recovery kit locally (in production, this should be securely managed)
      const recoveryKit = {
        key: BrowserBuffer.arrayBufferToBase64(encryptedData.key),
        iv: BrowserBuffer.arrayBufferToBase64(encryptedData.iv),
        capsuleId: 'pending', // Will be updated with actual capsule ID from contract
        ipfsCid: ipfsResult.cid,
      };
      
      const existingKeys = JSON.parse(localStorage.getItem('capsuleKeys') || '[]');
      existingKeys.push(recoveryKit);
      localStorage.setItem('capsuleKeys', JSON.stringify(existingKeys));
      
      // Step 7: Deploy to blockchain - CONTRACT IS NOW DEPLOYED!
      console.log('🚀 Deploying capsule to Base Sepolia blockchain...');
      
      const result = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: TIME_CAPSULE_ABI,
        functionName: 'createCapsule',
        args: [
          2, // CapsuleType.ENCRYPTED (uint8)
          hashHex as `0x${string}`, // contentHash (bytes32)
          ipfsResult.cid, // contentRef (string)
          BigInt(unlockTime), // unlockTime (uint64)
          params.recipients || [], // recipients (string[])
          visibility === 1 // isPublic (bool)
        ],
        value: BigInt(protocolFee),
      });
      
      console.log('🎉 Capsule created successfully on blockchain!');
      console.log('📝 Recovery kit stored locally');
      console.log('🔗 Transaction hash:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to create capsule:', error);
      throw error;
    }
  };
  
  return { createCapsule, hash, error, isPending };
}

// Compatibility class for existing code
export class TimeCapsuleContract {
  async createCapsule(params: CreateCapsuleParams): Promise<string> {
    console.log('TimeCapsuleContract.createCapsule called with:', params);
    console.log('Contract address:', CONTRACT_ADDRESS);
    
    // Mock implementation for now
    const capsuleId = Date.now().toString();
    
    // Store in localStorage temporarily for demo purposes
    const existingCapsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
    
    // Map visibility string to number
    const visibilityMap = { 'private': 0, 'public': 1, 'friends': 2 } as const;
    
    const newCapsule: Capsule = {
      id: capsuleId,
      creator: 'user123',
      title: params.title,
      description: params.description,
      unlockTime: Math.floor(params.unlockDate.getTime() / 1000),
      createdAt: Math.floor(Date.now() / 1000),
      isUnlocked: false,
      isRevealed: false,
      visibility: visibilityMap[params.visibility],
      ipfsHash: params.content, // Use the actual IPFS CID passed in content
    };
    
    existingCapsules.push(newCapsule);
    localStorage.setItem('timeCapsules', JSON.stringify(existingCapsules));
    
    return capsuleId;
  }

  async getUserCapsules(): Promise<Capsule[]> {
    const capsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
    return capsules;
  }

  async getCapsule(id: string): Promise<Capsule | null> {
    const capsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
    return capsules.find((c: Capsule) => c.id === id) || null;
  }

  async unlockCapsule(id: string): Promise<void> {
    console.log('Would unlock capsule on blockchain:', id);
  }

  async revealCapsule(id: string): Promise<string | null> {
    try {
      console.log('🔓 Revealing capsule:', id);
      
      // Step 1: Get recovery kit from local storage
      const recoveryKeys = JSON.parse(localStorage.getItem('capsuleKeys') || '[]');
      const recoveryKit = recoveryKeys.find((kit: StoredRecoveryKit) => kit.capsuleId === id);
      
      if (!recoveryKit) {
        console.error('❌ Recovery kit not found for capsule:', id);
        return null;
      }
      
      // Step 2: Download encrypted data from IPFS
      console.log('📥 Downloading from IPFS...');
      const capsuleData = await ipfsService.downloadCapsule(recoveryKit.ipfsCid);
      
      // Step 3: Decrypt the content
      console.log('🔐 Decrypting content...');
      const encryptedContent = BrowserBuffer.base64ToArrayBuffer(capsuleData.content);
      const key = BrowserBuffer.base64ToArrayBuffer(recoveryKit.key);
      const iv = BrowserBuffer.base64ToArrayBuffer(recoveryKit.iv);
      
      const decryptedContent = await cryptoService.decrypt(
        encryptedContent,
        key,
        iv
      );
      
      console.log('✅ Capsule revealed successfully!');
      return decryptedContent;
      
    } catch (error) {
      console.error('❌ Failed to reveal capsule:', error);
      return null;
    }
  }

  async getProtocolFee(): Promise<string> {
    return "0.001";
  }
}

export const timeCapsuleContract = new TimeCapsuleContract();

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: TIME_CAPSULE_ABI,
} as const;