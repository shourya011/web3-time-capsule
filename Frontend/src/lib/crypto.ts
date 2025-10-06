// Web Crypto AES-GCM Encryption Utilities

export interface EncryptedData {
  encryptedContent: ArrayBuffer;
  iv: ArrayBuffer;
  key: ArrayBuffer;
}

export interface RecoveryKit {
  key: string; // Base64 encoded key
  iv: string;  // Base64 encoded IV
  capsuleId: string;
  metadata?: {
    createdAt: number;
    version: string;
  };
}

export interface DecryptedCapsuleContent {
  title: string;
  description: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    encryptedData: string;
    iv: string;
    key: string;
  }>;
  createdAt: number;
  creator: string;
}

class CryptoService {
  // Generate a new AES-GCM key
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // Generate a random IV
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  // Encrypt data with AES-GCM
  async encrypt(data: string, key?: CryptoKey): Promise<EncryptedData> {
    const encryptionKey = key || await this.generateKey();
    const iv = this.generateIV();
    const encodedData = new TextEncoder().encode(data);

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      encryptionKey,
      encodedData
    );

    const exportedKey = await crypto.subtle.exportKey('raw', encryptionKey);

    return {
      encryptedContent,
      iv: iv.buffer as ArrayBuffer,
      key: exportedKey,
    };
  }

  // Decrypt data with AES-GCM
  async decrypt(encryptedData: ArrayBuffer, key: ArrayBuffer, iv: ArrayBuffer): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  }

  // Create a recovery kit for the user
  createRecoveryKit(encryptedData: EncryptedData, capsuleId: string): RecoveryKit {
    return {
      key: this.arrayBufferToBase64(encryptedData.key),
      iv: this.arrayBufferToBase64(encryptedData.iv),
      capsuleId,
      metadata: {
        createdAt: Date.now(),
        version: '1.0',
      },
    };
  }

  // Validate recovery kit format and structure
  validateRecoveryKit(kit: unknown): { isValid: boolean; error?: string } {
    try {
      // Check if kit is an object
      if (!kit || typeof kit !== 'object') {
        return { isValid: false, error: 'Recovery kit must be a valid JSON object' };
      }

      const recoveryKit = kit as Record<string, unknown>;

      // Check required fields
      if (!recoveryKit.key || typeof recoveryKit.key !== 'string') {
        return { isValid: false, error: 'Recovery kit missing or invalid encryption key' };
      }

      if (!recoveryKit.iv || typeof recoveryKit.iv !== 'string') {
        return { isValid: false, error: 'Recovery kit missing or invalid initialization vector' };
      }

      if (!recoveryKit.capsuleId || typeof recoveryKit.capsuleId !== 'string') {
        return { isValid: false, error: 'Recovery kit missing or invalid capsule ID' };
      }

      // Skip base64 validation for mock capsules (they will be handled differently)
      if (typeof recoveryKit.capsuleId === 'string' && recoveryKit.capsuleId.toString().match(/^\d+$/)) {
        console.log('🎭 Detected mock capsule ID - skipping base64 validation');
        return { isValid: true };
      }

      // Validate base64 format for key and iv with better error handling
      try {
        // Clean and validate base64 strings
        const cleanKey = recoveryKit.key.trim().replace(/\s/g, '');
        const cleanIv = recoveryKit.iv.trim().replace(/\s/g, '');
        
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
          return { isValid: false, error: 'Recovery kit key contains invalid base64 characters' };
        }
        
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanIv)) {
          return { isValid: false, error: 'Recovery kit IV contains invalid base64 characters' };
        }
        
        // Test decoding
        atob(cleanKey);
        atob(cleanIv);
      } catch (error) {
        return { isValid: false, error: `Recovery kit contains invalid base64 encoded data: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }

      // Check key and IV lengths (AES-256-GCM requires 32-byte key, 12-byte IV)
      try {
        const keyBuffer = this.base64ToArrayBuffer(recoveryKit.key);
        const ivBuffer = this.base64ToArrayBuffer(recoveryKit.iv);

        if (keyBuffer.byteLength !== 32) {
          return { isValid: false, error: 'Invalid encryption key length' };
        }

        if (ivBuffer.byteLength !== 12) {
          return { isValid: false, error: 'Invalid initialization vector length' };
        }
      } catch (error) {
        return { isValid: false, error: 'Failed to validate key/IV buffer lengths' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate recovery kit format' };
    }
  }

  // Decrypt capsule content using recovery kit with enhanced error handling
  async decryptCapsuleContent(
    encryptedContentBase64: string, 
    recoveryKit: RecoveryKit
  ): Promise<DecryptedCapsuleContent> {
    try {
      console.log('🔐 Starting decryption process...');
      console.log('Recovery kit capsule ID:', recoveryKit.capsuleId);
      console.log('Encrypted content length:', encryptedContentBase64.length);
      console.log('Recovery kit key length:', recoveryKit.key.length);
      console.log('Recovery kit IV length:', recoveryKit.iv.length);

      // Validate recovery kit first
      const validation = this.validateRecoveryKit(recoveryKit);
      if (!validation.isValid) {
        throw new Error(`Invalid recovery kit: ${validation.error}`);
      }

      console.log('✅ Recovery kit validation passed');

      // Check if encrypted content looks like valid base64
      if (!encryptedContentBase64 || typeof encryptedContentBase64 !== 'string') {
        throw new Error('Encrypted content is missing or invalid');
      }

      console.log('📝 Encrypted content preview:', encryptedContentBase64.substring(0, 100) + '...');

      // Convert base64 encrypted content back to ArrayBuffer
      console.log('🔄 Converting base64 to ArrayBuffer...');
      const encryptedContent = this.base64ToArrayBuffer(encryptedContentBase64);
      console.log('✅ Conversion successful, buffer size:', encryptedContent.byteLength);
      
      // Decrypt the content
      console.log('🔓 Decrypting content...');
      const decryptedString = await this.decryptWithRecoveryKit(encryptedContent, recoveryKit);
      console.log('✅ Decryption successful, result length:', decryptedString.length);
      
      // Parse the decrypted JSON
      console.log('📊 Parsing decrypted JSON...');
      const capsuleContent: DecryptedCapsuleContent = JSON.parse(decryptedString);
      
      // Validate the decrypted content structure
      if (!capsuleContent.title || !capsuleContent.creator) {
        throw new Error('Decrypted content has invalid structure');
      }

      console.log('✅ Decryption completed successfully');
      return capsuleContent;
    } catch (error) {
      console.error('❌ Failed to decrypt capsule content:', error);
      if (error instanceof Error && error.message.includes('atob')) {
        console.error('Base64 decode error - corrupted data detected');
        console.error('Encrypted content sample:', encryptedContentBase64?.substring(0, 200));
        console.error('Recovery kit:', recoveryKit);
      }
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt using recovery kit
  async decryptWithRecoveryKit(
    encryptedContent: ArrayBuffer, 
    recoveryKit: RecoveryKit
  ): Promise<string> {
    const key = this.base64ToArrayBuffer(recoveryKit.key);
    const iv = this.base64ToArrayBuffer(recoveryKit.iv);
    
    return await this.decrypt(encryptedContent, key, iv);
  }

  // Utility: ArrayBuffer to Base64
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Utility: Base64 to ArrayBuffer with improved error handling
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      // Clean the base64 string - remove any whitespace and ensure proper padding
      let cleanBase64 = base64.trim().replace(/\s/g, '');
      
      // Ensure proper padding
      while (cleanBase64.length % 4) {
        cleanBase64 += '=';
      }
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error('Invalid base64 format');
      }
      
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Base64 decode error:', error);
      throw new Error(`Failed to decode base64 data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Encrypt file content
  async encryptFile(file: File): Promise<{ encryptedData: EncryptedData; originalName: string; type: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const base64Content = this.arrayBufferToBase64(arrayBuffer);
          const fileData = JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64Content,
          });
          
          const encryptedData = await this.encrypt(fileData);
          resolve({
            encryptedData,
            originalName: file.name,
            type: file.type,
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Decrypt file content
  async decryptFile(encryptedContent: ArrayBuffer, recoveryKit: RecoveryKit): Promise<{ blob: Blob; name: string; type: string }> {
    const decryptedData = await this.decryptWithRecoveryKit(encryptedContent, recoveryKit);
    const fileData = JSON.parse(decryptedData);
    
    const content = this.base64ToArrayBuffer(fileData.content);
    const blob = new Blob([content], { type: fileData.type });
    
    return {
      blob,
      name: fileData.name,
      type: fileData.type,
    };
  }
}

// Singleton instance
export const cryptoService = new CryptoService();