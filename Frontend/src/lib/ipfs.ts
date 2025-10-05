// Real IPFS Service using Pinata API
export interface IPFSUploadResult {
  cid: string;
  url: string;
  size: number;
  method: 'pinata' | 'localStorage';
  gatewayUrl: string;
}

export interface EncryptedCapsuleData {
  title: string;
  description: string;
  content: string;
  encryptedAt: number;
  metadata: {
    creator: string;
    createdAt: number;
    unlockTime: number;
    visibility: string;
  };
}

class IPFSService {
  private pinataJWT: string;
  private pinataApiUrl = 'https://api.pinata.cloud';
  private pinataGateway = 'https://gateway.pinata.cloud';

  constructor() {
    // Get Pinata JWT from environment variables
    this.pinataJWT = import.meta.env.VITE_PINATA_JWT || '';
    
    if (!this.pinataJWT) {
      console.warn('⚠️ VITE_PINATA_JWT not found in environment variables');
    } else {
      console.log('🔑 Pinata JWT loaded successfully');
    }
  }

  // Upload to Pinata IPFS
  private async uploadToPinata(data: string, fileName: string): Promise<IPFSUploadResult> {
    if (!this.pinataJWT) {
      console.warn('❌ No Pinata JWT available, falling back to localStorage');
      return this.fallbackToLocalStorage(data, fileName);
    }

    try {
      console.log(`� Uploading to Pinata IPFS: ${fileName} (${data.length} chars)`);
      
      const formData = new FormData();
      const blob = new Blob([data], { type: 'application/json' });
      formData.append('file', blob, fileName);
      
      // Add metadata
      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          app: 'time-capsule',
          size: data.length.toString(),
        }
      });
      formData.append('pinataMetadata', metadata);

      // Upload options
      const options = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', options);

      const response = await fetch(`${this.pinataApiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully uploaded to Pinata IPFS: ${result.IpfsHash}`);
      
      return {
        cid: result.IpfsHash,
        url: `${this.pinataGateway}/ipfs/${result.IpfsHash}`,
        size: result.PinSize || data.length,
        method: 'pinata',
        gatewayUrl: `${this.pinataGateway}/ipfs/${result.IpfsHash}`,
      };
      
    } catch (error) {
      console.error('❌ Pinata upload failed:', error);
      console.log('🔄 Falling back to localStorage...');
      return this.fallbackToLocalStorage(data, fileName);
    }
  }

  // Reliable localStorage fallback (for development/demo)
  private fallbackToLocalStorage(data: string, fileName: string): IPFSUploadResult {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 8);
    const mockCid = `local_${timestamp}_${randomId}`;
    
    localStorage.setItem(`ipfs_${mockCid}`, data);
    localStorage.setItem(`ipfs_meta_${mockCid}`, JSON.stringify({
      fileName,
      uploadedAt: timestamp,
      size: data.length,
    }));
    
    console.log(`🏠 Using localStorage fallback - CID: ${mockCid}`);
    console.log(`📄 Stored ${data.length} characters`);
    
    return {
      cid: mockCid,
      url: `local://${mockCid}`,
      size: data.length,
      method: 'localStorage',
      gatewayUrl: `local://${mockCid}`,
    };
  }

  // Upload string content to IPFS
  async uploadString(content: string, fileName = 'content.txt'): Promise<IPFSUploadResult> {
    console.log(`📤 Starting IPFS upload for: ${fileName} (${content.length} chars)`);
    return this.uploadToPinata(content, fileName);
  }

  // Upload JSON data to IPFS
  async uploadJSON(data: Record<string, unknown>, fileName = 'data.json'): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    return this.uploadString(jsonString, fileName);
  }

  // Upload encrypted capsule data
  async uploadCapsule(capsuleData: EncryptedCapsuleData): Promise<IPFSUploadResult> {
    const fileName = `capsule_${Date.now()}.json`;
    return this.uploadJSON(capsuleData as unknown as Record<string, unknown>, fileName);
  }

  // Download content from IPFS with improved error handling and CORS support
  async download(cid: string): Promise<string> {
    console.log(`📥 Downloading from CID: ${cid}`);
    
    // Validate CID format
    if (!cid || cid.trim() === '') {
      throw new Error('Invalid CID: CID cannot be empty');
    }
    
    // Check if it's a local storage fallback
    if (cid.startsWith('local_')) {
      console.log(`🏠 Retrieving from localStorage: ${cid}`);
      const stored = localStorage.getItem(`ipfs_${cid}`);
      if (!stored) {
        throw new Error(`Content not found in localStorage for CID: ${cid}`);
      }
      console.log(`✅ Successfully retrieved from localStorage (${stored.length} chars)`);
      return stored;
    }

    // First, try Pinata's direct API (more reliable for recently uploaded content)
    if (this.pinataJWT) {
      try {
        console.log('🔑 Trying Pinata API first...');
        const pinataApiResponse = await fetch(`${this.pinataApiUrl}/data/pinList?status=pinned&hashContains=${cid}`, {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
          },
        });

        if (pinataApiResponse.ok) {
          const pinData = await pinataApiResponse.json();
          if (pinData.rows && pinData.rows.length > 0) {
            console.log('✅ Found content in Pinata, attempting gateway download...');
          }
        }
      } catch (error) {
        console.warn('⚠️ Pinata API check failed, continuing with gateways...', error);
      }
    }
    
    // Try multiple IPFS gateways with improved CORS handling
    const gateways = [
      // Pinata gateway (should work best for our uploads)
      `${this.pinataGateway}/ipfs/${cid}`,
      // Public gateways with good CORS support
      `https://ipfs.io/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.ipfs.io/ipfs/${cid}`,
      // Additional reliable gateways
      `https://cf-ipfs.com/ipfs/${cid}`,
    ];
    
    let lastError: Error | null = null;
    
    // Try each gateway with retries
    for (let gatewayIndex = 0; gatewayIndex < gateways.length; gatewayIndex++) {
      const gateway = gateways[gatewayIndex];
      
      // Retry each gateway up to 2 times
      for (let retry = 0; retry < 2; retry++) {
        try {
          const retryText = retry > 0 ? ` (retry ${retry})` : '';
          console.log(`🔍 Trying gateway: ${gateway}${retryText}`);
          
          // Add delay between retries and after first gateway
          if (retry > 0 || gatewayIndex > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 + (retry * 2000)));
          }
          
          // Create a timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
          );
          
          const fetchPromise = fetch(gateway, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Cache-Control': 'no-cache',
              'User-Agent': 'TimeCapsule/1.0',
            },
            mode: 'cors', // Explicitly set CORS mode
          });
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (response.ok) {
            const content = await response.text();
            console.log(`✅ Successfully downloaded from: ${gateway}${retryText}`);
            console.log(`📄 Content length: ${content.length} chars`);
            console.log(`📄 Content preview: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`);
            return content;
          } else {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            console.warn(`❌ Gateway returned ${response.status}: ${gateway}${retryText}`);
            
            // Don't retry on 404 errors
            if (response.status === 404) {
              break;
            }
          }
        } catch (error) {
          const retryText = retry > 0 ? ` (retry ${retry})` : '';
          lastError = error as Error;
          console.warn(`❌ Gateway failed: ${gateway}${retryText}`, error);
          
          // If it's a CORS error, try next gateway immediately
          if (error instanceof TypeError && error.message.includes('CORS')) {
            console.log('🚫 CORS error detected, trying next gateway...');
            break;
          }
        }
      }
    }
    
    // If all gateways fail, provide helpful error message
    const helpfulError = this.getHelpfulDownloadError(cid, lastError);
    throw new Error(helpfulError);
  }

  // Provide helpful error messages for download failures
  private getHelpfulDownloadError(cid: string, lastError: Error | null): string {
    const errorMessage = lastError?.message || 'Unknown error';
    
    if (errorMessage.includes('CORS')) {
      return `Download failed due to CORS restrictions. CID: ${cid}. Try using a different browser or wait a few minutes for IPFS propagation.`;
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return `Content not found on IPFS network. CID: ${cid}. The content may not be fully propagated yet. Please wait a few minutes and try again.`;
    }
    
    if (errorMessage.includes('timeout')) {
      return `Download timed out. CID: ${cid}. IPFS gateways may be slow. Please try again later.`;
    }
    
    if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
      return `Network error while downloading. CID: ${cid}. This may be due to CORS restrictions or slow IPFS propagation. Wait 2-3 minutes and try again.`;
    }
    
    return `Failed to download content from IPFS. CID: ${cid}. Error: ${errorMessage}. Please try again in a few minutes.`;
  }

  // Download and parse JSON data
  async downloadJSON(cid: string): Promise<Record<string, unknown>> {
    const content = await this.download(cid);
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to parse JSON content from CID: ${cid} - ${error}`);
    }
  }

  // Download capsule data
  async downloadCapsule(cid: string): Promise<EncryptedCapsuleData> {
    const data = await this.downloadJSON(cid);
    return data as unknown as EncryptedCapsuleData;
  }

  // Get IPFS gateway URL
  getGatewayUrl(cid: string, fileName?: string): string {
    if (cid.startsWith('local_')) {
      return `local://${cid}`;
    }
    return fileName 
      ? `${this.pinataGateway}/ipfs/${cid}/${fileName}`
      : `${this.pinataGateway}/ipfs/${cid}`;
  }

  // Check if IPFS is available
  async isAvailable(): Promise<boolean> {
    if (this.pinataJWT) {
      try {
        // Test Pinata API connectivity
        const response = await fetch(`${this.pinataApiUrl}/data/testAuthentication`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
          },
        });
        const isConnected = response.ok;
        console.log(`📡 Pinata API ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);
        return isConnected;
      } catch (error) {
        console.warn('⚠️ Pinata API test failed:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage info from Pinata
  async getStorageInfo(): Promise<{ used: number; limit: number; method: string }> {
    if (!this.pinataJWT) {
      return { used: 0, limit: 0, method: 'localStorage' };
    }

    try {
      const response = await fetch(`${this.pinataApiUrl}/data/userPinnedDataTotal`, {
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          used: data.pin_size_total || 0,
          limit: 1024 * 1024 * 1024, // 1GB free tier
          method: 'pinata',
        };
      }
    } catch (error) {
      console.warn('Failed to get Pinata storage info:', error);
    }

    return { used: 0, limit: 0, method: 'localStorage' };
  }
}

// Singleton instance
export const ipfsService = new IPFSService();