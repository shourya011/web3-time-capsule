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
    };
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

  // Utility: Base64 to ArrayBuffer
  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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