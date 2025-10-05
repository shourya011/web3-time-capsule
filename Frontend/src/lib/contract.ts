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

// Mock contract adapter - replace with real contract calls later
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