// Reveal Service for Time Capsule Early Reveal Functionality
import { ipfsService } from './ipfs';
import { cryptoService, type RecoveryKit, type DecryptedCapsuleContent } from './crypto';

export interface RevealedCapsule {
  id: string;
  originalData: DecryptedCapsuleContent;
  revealMetadata: {
    revealedAt: number;
    revealedBy: string;
    isEarlyReveal: boolean;
    originalUnlockTime: number;
    revealMessage?: string;
    socialInteractions: {
      likes: number;
      comments: Array<{
        id: string;
        author: string;
        content: string;
        timestamp: number;
      }>;
    };
  };
}

export interface RevealResult {
  success: boolean;
  data?: RevealedCapsule;
  error?: string;
}

class RevealService {
  private readonly REVEALED_CAPSULES_KEY = 'revealed_capsules';
  private readonly SOCIAL_INTERACTIONS_KEY = 'social_interactions';

  // Fetch and decrypt capsule content using recovery kit
  async revealCapsule(
    capsuleId: string,
    recoveryKit: RecoveryKit,
    userAddress: string,
    originalUnlockTime: number,
    revealMessage?: string
  ): Promise<RevealResult> {
    try {
      console.log('🔓 Starting capsule reveal process...', { capsuleId, userAddress });

      // Validate recovery kit
      const validation = cryptoService.validateRecoveryKit(recoveryKit);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid recovery kit: ${validation.error}`,
        };
      }

      // Verify capsule ID matches recovery kit
      if (recoveryKit.capsuleId !== capsuleId) {
        // For mock capsules, allow any recovery kit to work
        if (!capsuleId.match(/^\d+$/)) {
          return {
            success: false,
            error: 'Recovery kit does not match the specified capsule',
          };
        }
        console.log('🎭 Mock capsule - bypassing capsule ID validation');
      }

      // Check if capsule is already revealed
      const existingRevealed = this.getRevealedCapsule(capsuleId);
      if (existingRevealed) {
        return {
          success: false,
          error: 'This capsule has already been revealed',
        };
      }

      // Get IPFS CID for this capsule (from localStorage or contract)
      const ipfsCid = await this.getCapsuleIPFSHash(capsuleId);
      if (!ipfsCid) {
        return {
          success: false,
          error: 'Could not find IPFS content for this capsule',
        };
      }

      console.log('📝 Found IPFS CID:', ipfsCid, 'for capsule:', capsuleId);

      // Fetch encrypted content from IPFS
      console.log('📥 Fetching encrypted content from IPFS...', ipfsCid);
      let encryptedContent: string;
      
      // Handle mock IPFS hashes for testing - only check CID format, not timestamp-based capsule IDs
      if (ipfsCid.startsWith('mock_')) {
        console.log('🎭 Detected mock scenario (mock CID) - bypassing all encryption/decryption');
        
        // For testing purposes, simulate successful decryption without IPFS
        const mockDecryptedContent: DecryptedCapsuleContent = {
          title: "Test Time Capsule", 
          description: "This is a test capsule for early reveal functionality",
          files: [],
          createdAt: Date.now(),
          creator: userAddress
        };
        
        // Calculate if this is early reveal
        const isEarlyReveal = Date.now() < originalUnlockTime * 1000;
        
        // Create revealed capsule directly without actual decryption
        const revealedCapsule: RevealedCapsule = {
          id: capsuleId,
          originalData: mockDecryptedContent,
          revealMetadata: {
            revealedAt: Date.now(),
            revealedBy: userAddress,
            isEarlyReveal,
            originalUnlockTime,
            revealMessage: revealMessage || '',
            socialInteractions: {
              likes: 0,
              comments: []
            }
          }
        };

        // Store the revealed capsule
        this.storeRevealedCapsule(revealedCapsule);

        console.log('✅ Mock reveal completed successfully - bypassed encryption/decryption');
        return {
          success: true,
          data: revealedCapsule,
        };
      }
      
      // Real IPFS download for actual content
      try {
        encryptedContent = await ipfsService.download(ipfsCid);
        console.log('✅ Successfully downloaded from IPFS, length:', encryptedContent.length);
      } catch (ipfsError) {
        console.error('❌ IPFS download failed:', ipfsError);
        return {
          success: false,
          error: `Failed to download content from IPFS: ${ipfsError instanceof Error ? ipfsError.message : 'Unknown error'}`,
        };
      }

      // Decrypt the content
      console.log('🔐 Decrypting capsule content...');
      const decryptedData = await cryptoService.decryptCapsuleContent(encryptedContent, recoveryKit);

      // Verify user authorization (creator or recipient)
      if (!this.isUserAuthorized(decryptedData, userAddress)) {
        return {
          success: false,
          error: 'You are not authorized to reveal this capsule',
        };
      }

      // Create revealed capsule data
      const isEarlyReveal = Date.now() < originalUnlockTime * 1000;
      const revealedCapsule: RevealedCapsule = {
        id: capsuleId,
        originalData: decryptedData,
        revealMetadata: {
          revealedAt: Date.now(),
          revealedBy: userAddress,
          isEarlyReveal,
          originalUnlockTime,
          revealMessage,
          socialInteractions: {
            likes: 0,
            comments: [],
          },
        },
      };

      // Store revealed capsule
      this.storeRevealedCapsule(revealedCapsule);

      console.log('✅ Capsule revealed successfully!', { capsuleId, isEarlyReveal });

      return {
        success: true,
        data: revealedCapsule,
      };
    } catch (error) {
      console.error('❌ Failed to reveal capsule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Decrypt files from revealed capsule content
  async decryptCapsuleFiles(revealedCapsule: RevealedCapsule): Promise<Array<{
    name: string;
    type: string;
    blob: Blob;
    url: string;
  }>> {
    const files = revealedCapsule.originalData.files || [];
    const decryptedFiles = [];

    for (const file of files) {
      try {
        // Create a temporary recovery kit for this file
        const fileRecoveryKit: RecoveryKit = {
          key: file.key,
          iv: file.iv,
          capsuleId: revealedCapsule.id,
        };

        // Decrypt file content
        const encryptedContent = cryptoService.base64ToArrayBuffer(file.encryptedData);
        const decryptedFile = await cryptoService.decryptFile(encryptedContent, fileRecoveryKit);

        // Create object URL for the file
        const url = URL.createObjectURL(decryptedFile.blob);

        decryptedFiles.push({
          name: decryptedFile.name,
          type: decryptedFile.type,
          blob: decryptedFile.blob,
          url,
        });
      } catch (error) {
        console.error(`Failed to decrypt file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return decryptedFiles;
  }

  // Get all revealed capsules for social feed
  getRevealedCapsules(): RevealedCapsule[] {
    try {
      const stored = localStorage.getItem(this.REVEALED_CAPSULES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load revealed capsules:', error);
      return [];
    }
  }

  // Get specific revealed capsule
  getRevealedCapsule(capsuleId: string): RevealedCapsule | null {
    const revealed = this.getRevealedCapsules();
    return revealed.find(capsule => capsule.id === capsuleId) || null;
  }

  // Social interaction methods
  likeCapsule(capsuleId: string): boolean {
    try {
      const revealed = this.getRevealedCapsules();
      const capsuleIndex = revealed.findIndex(c => c.id === capsuleId);
      
      if (capsuleIndex === -1) return false;

      revealed[capsuleIndex].revealMetadata.socialInteractions.likes += 1;
      localStorage.setItem(this.REVEALED_CAPSULES_KEY, JSON.stringify(revealed));
      
      return true;
    } catch (error) {
      console.error('Failed to like capsule:', error);
      return false;
    }
  }

  addComment(capsuleId: string, author: string, content: string): boolean {
    try {
      const revealed = this.getRevealedCapsules();
      const capsuleIndex = revealed.findIndex(c => c.id === capsuleId);
      
      if (capsuleIndex === -1) return false;

      const comment = {
        id: Date.now().toString(),
        author,
        content,
        timestamp: Date.now(),
      };

      revealed[capsuleIndex].revealMetadata.socialInteractions.comments.push(comment);
      localStorage.setItem(this.REVEALED_CAPSULES_KEY, JSON.stringify(revealed));
      
      return true;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return false;
    }
  }

  // Private helper methods
  private storeRevealedCapsule(capsule: RevealedCapsule): void {
    const revealed = this.getRevealedCapsules();
    
    // Remove existing entry if it exists
    const filteredRevealed = revealed.filter(c => c.id !== capsule.id);
    
    // Add new entry
    filteredRevealed.push(capsule);
    
    localStorage.setItem(this.REVEALED_CAPSULES_KEY, JSON.stringify(filteredRevealed));
  }

  // Clear all revealed capsules from local storage
  clearAllRevealedCapsules(): void {
    localStorage.removeItem(this.REVEALED_CAPSULES_KEY);
    localStorage.removeItem(this.SOCIAL_INTERACTIONS_KEY);
    console.log('🗑️ Cleared all revealed capsules from social feed');
  }

  private async getCapsuleIPFSHash(capsuleId: string): Promise<string | null> {
    try {
      // Try to get from localStorage first (for demo purposes)
      const storedCapsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
      const capsule = storedCapsules.find((c: { id: string; ipfsHash?: string }) => c.id === capsuleId);
      
      if (capsule?.ipfsHash) {
        console.log('📝 Found IPFS hash for capsule:', capsule.ipfsHash);
        return capsule.ipfsHash;
      }

      // In a real implementation, this would query the smart contract
      // For now, we'll use a mock CID or return null
      return null;
    } catch (error) {
      console.error('Failed to get IPFS hash:', error);
      return null;
    }
  }

  private isUserAuthorized(capsuleData: DecryptedCapsuleContent, userAddress: string): boolean {
    // Check if user is the creator
    if (capsuleData.creator.toLowerCase() === userAddress.toLowerCase()) {
      return true;
    }

    // In a real implementation, you would also check if the user is in the recipients list
    // For now, we'll just check the creator
    return false;
  }

  // Preview capsule content without revealing (bypasses "already revealed" check)
  async previewCapsule(
    capsuleId: string,
    recoveryKit: RecoveryKit,
    userAddress: string,
    originalUnlockTime: number
  ): Promise<RevealResult> {
    try {
      console.log('👀 Starting capsule preview process...', { capsuleId, userAddress });

      // Validate recovery kit
      const validation = cryptoService.validateRecoveryKit(recoveryKit);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid recovery kit',
        };
      }

      // Mock capsule validation (bypass ID check for development)
      if (capsuleId.startsWith('mock_')) {
        console.log('🎭 Mock capsule - bypassing capsule ID validation');
      }

      // Get IPFS CID for this capsule (from localStorage or contract)
      const ipfsCid = await this.getCapsuleIPFSHash(capsuleId);
      if (!ipfsCid) {
        return {
          success: false,
          error: 'Unable to locate capsule data on IPFS',
        };
      }

      let decryptedContent: DecryptedCapsuleContent;
      
      // Handle mock IPFS hashes for testing - only check CID format, not timestamp-based capsule IDs
      if (ipfsCid.startsWith('mock_')) {
        console.log('🎭 Detected mock scenario (mock CID) - bypassing all encryption/decryption');
        
        // For testing purposes, simulate successful decryption without IPFS
        decryptedContent = {
          title: "Test Time Capsule", 
          description: "This is a test capsule for early reveal functionality",
          files: [],
          createdAt: Date.now(),
          creator: userAddress
        };
      } else {
        // Real IPFS decryption logic
        try {
          console.log('📥 Downloading from IPFS for preview...', ipfsCid);
          const encryptedContent = await ipfsService.download(ipfsCid);
          console.log('✅ Successfully downloaded from IPFS for preview, length:', encryptedContent.length);
          
          console.log('🔐 Decrypting capsule content for preview...');
          decryptedContent = await cryptoService.decryptCapsuleContent(encryptedContent, recoveryKit);
          console.log('✅ Capsule content decrypted successfully for preview!');
        } catch (error) {
          console.error('❌ Failed to decrypt real capsule for preview:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to decrypt capsule content',
          };
        }
      }

      // Verify user authorization
      if (!this.isUserAuthorized(decryptedContent, userAddress)) {
        return {
          success: false,
          error: 'You are not authorized to access this capsule',
        };
      }

      const isEarlyReveal = Date.now() < originalUnlockTime * 1000;

      // Create preview data (similar to revealed capsule but for preview only)
      const previewData: RevealedCapsule = {
        id: capsuleId,
        originalData: decryptedContent,
        revealMetadata: {
          revealedAt: Date.now(),
          revealedBy: userAddress,
          isEarlyReveal,
          originalUnlockTime,
          socialInteractions: {
            likes: 0,
            comments: [],
          },
        },
      };

      console.log('✅ Capsule preview loaded successfully!', { capsuleId, isEarlyReveal });

      return {
        success: true,
        data: previewData,
      };
    } catch (error) {
      console.error('❌ Failed to preview capsule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Auto-reveal naturally unlocked capsules and add them to social feed
  async checkAndRevealUnlockedCapsules(userAddress: string): Promise<number> {
    try {
      console.log('🕐 Checking for naturally unlocked capsules...', userAddress);
      
      const currentTime = Date.now() / 1000;
      let autoRevealedCount = 0;
      
      // Get all capsules from localStorage (in real app, this would be from the contract)
      const storedCapsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
      // For demo purposes, check all capsules that the user might have access to
      // In a real app, this would be filtered by contract ownership/permissions
      const accessibleCapsules = storedCapsules;
      
      // Get recovery kits for decryption
      const recoveryKits = JSON.parse(localStorage.getItem('capsuleKeys') || '[]');
      
      console.log(`📋 Found ${accessibleCapsules.length} total capsules and ${recoveryKits.length} recovery kits`);
      
      // Check each capsule to see if it's naturally unlocked
      for (const capsule of accessibleCapsules) {
        console.log(`🔍 Checking capsule "${capsule.title}" (ID: ${capsule.id})`);
        console.log(`   Unlock time: ${capsule.unlockTime} (${new Date(capsule.unlockTime * 1000).toLocaleString()})`);
        console.log(`   Current time: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`);
        
        const isNaturallyUnlocked = currentTime >= capsule.unlockTime;
        const isAlreadyRevealed = this.getRevealedCapsule(capsule.id) !== null;
        
        console.log(`   Is naturally unlocked: ${isNaturallyUnlocked}`);
        console.log(`   Is already revealed: ${isAlreadyRevealed}`);
        
        if (isNaturallyUnlocked && !isAlreadyRevealed) {
          // Find the recovery kit for this capsule
          const recoveryKit = recoveryKits.find((kit: { capsuleId: string; ipfsCid: string }) => 
            kit.capsuleId === capsule.id || kit.ipfsCid === capsule.ipfsHash
          );
          
          console.log(`   Recovery kit found: ${!!recoveryKit}`);
          if (recoveryKit) {
            console.log(`   Recovery kit details:`, { capsuleId: recoveryKit.capsuleId, ipfsCid: recoveryKit.ipfsCid });
          }
          
          if (recoveryKit) {
            console.log(`🔓 Auto-revealing naturally unlocked capsule: ${capsule.id}`);
            
            try {
              const revealResult = await this.revealCapsule(
                capsule.id,
                recoveryKit,
                userAddress,
                capsule.unlockTime,
                'Automatically revealed when unlock time was reached'
              );
              
              if (revealResult.success) {
                autoRevealedCount++;
                console.log(`✅ Successfully auto-revealed capsule: ${capsule.id}`);
              } else {
                console.warn(`⚠️ Failed to auto-reveal capsule ${capsule.id}:`, revealResult.error);
              }
            } catch (error) {
              console.error(`❌ Error auto-revealing capsule ${capsule.id}:`, error);
            }
          } else {
            console.warn(`⚠️ No recovery kit found for unlocked capsule: ${capsule.id}`);
          }
        }
      }
      
      if (autoRevealedCount > 0) {
        console.log(`🎉 Auto-revealed ${autoRevealedCount} naturally unlocked capsules!`);
      }
      
      return autoRevealedCount;
    } catch (error) {
      console.error('❌ Failed to check unlocked capsules:', error);
      return 0;
    }
  }
}

// Singleton instance
export const revealService = new RevealService();