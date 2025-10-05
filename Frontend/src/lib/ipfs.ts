// IPFS Service using Web3.storage (mock implementation)

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

interface MockStorageItem {
  data: ArrayBuffer;
  fileName: string;
  uploadedAt: number;
}

class IPFSService {
  private mockStorage: Map<string, MockStorageItem> = new Map();

  // Mock upload to IPFS
  async upload(data: ArrayBuffer, fileName: string): Promise<IPFSUploadResult> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock CID
    const mockCid = `Qm${Math.random().toString(36).slice(2, 20)}${Math.random().toString(36).slice(2, 20)}`;
    
    // Store in mock storage
    this.mockStorage.set(mockCid, {
      data,
      fileName,
      uploadedAt: Date.now(),
    });

    return {
      cid: mockCid,
      url: `https://ipfs.io/ipfs/${mockCid}`,
    };
  }

  // Mock download from IPFS
  async download(cid: string): Promise<ArrayBuffer> {
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const stored = this.mockStorage.get(cid);
    if (!stored) {
      throw new Error(`Content not found for CID: ${cid}`);
    }

    return stored.data;
  }

  // Upload JSON data
  async uploadJSON(data: Record<string, unknown>): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(data);
    const buffer = new TextEncoder().encode(jsonString);
    return this.upload(buffer.buffer, 'data.json');
  }

  // Download and parse JSON data
  async downloadJSON(cid: string): Promise<Record<string, unknown>> {
    const buffer = await this.download(cid);
    const jsonString = new TextDecoder().decode(buffer);
    return JSON.parse(jsonString) as Record<string, unknown>;
  }

  // Get IPFS gateway URL
  getGatewayUrl(cid: string): string {
    return `https://ipfs.io/ipfs/${cid}`;
  }
}

// Singleton instance
export const ipfsService = new IPFSService();