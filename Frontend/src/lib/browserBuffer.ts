// Browser-compatible utility functions
// Replacements for Node.js Buffer in browser environment

export class BrowserBuffer {
  // Convert ArrayBuffer to base64 string
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Convert base64 string to ArrayBuffer
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Convert string to ArrayBuffer (UTF-8)
  static stringToArrayBuffer(str: string): ArrayBuffer {
    return new TextEncoder().encode(str).buffer;
  }

  // Convert ArrayBuffer to string (UTF-8)
  static arrayBufferToString(buffer: ArrayBuffer): string {
    return new TextDecoder().decode(buffer);
  }

  // Convert Uint8Array to base64
  static uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  // Convert base64 to Uint8Array
  static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

// Polyfill for environments where Buffer might be expected
if (typeof globalThis !== 'undefined' && !globalThis.Buffer && typeof window !== 'undefined') {
  // Only add polyfill in browser environment, not in Node.js
  (globalThis as any).Buffer = {
    from: (data: any, encoding?: string) => {
      if (encoding === 'base64') {
        return BrowserBuffer.base64ToUint8Array(data);
      }
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(data);
    },
    toString: (encoding?: string) => {
      // This is a simplified version
      return '[object Buffer]';
    }
  };
}