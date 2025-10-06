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

  // Download content from IPFS with advanced CORS handling and Pinata API integration
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

    // Strategy 1: Try CORS proxy services
    console.log('🔄 Strategy 1: Trying CORS proxy services...');
    const corsProxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(`${this.pinataGateway}/ipfs/${cid}`)}`,
      `https://cors-anywhere.herokuapp.com/${this.pinataGateway}/ipfs/${cid}`,
      `https://corsproxy.io/?${encodeURIComponent(`${this.pinataGateway}/ipfs/${cid}`)}`,
    ];

    for (const proxyUrl of corsProxies) {
      try {
        console.log(`🔍 Trying CORS proxy: ${proxyUrl.split('?')[0]}...`);
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Different proxies return data in different formats
          const content = data.contents || data.data || data.response || JSON.stringify(data);
          if (content && typeof content === 'string') {
            console.log(`✅ Successfully downloaded via CORS proxy`);
            return content;
          }
        }
      } catch (error) {
        console.warn(`❌ CORS proxy failed:`, error);
      }
    }

    // Strategy 2: Try Pinata's pin list API first (most reliable for our uploads)
    if (this.pinataJWT) {
      try {
        console.log('🔑 Strategy 2: Checking Pinata pin list...');
        const pinListResponse = await fetch(`${this.pinataApiUrl}/data/pinList?status=pinned&hashContains=${cid}&pageLimit=1`, {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
          },
        });

        if (pinListResponse.ok) {
          const pinData = await pinListResponse.json();
          if (pinData.rows && pinData.rows.length > 0) {
            console.log('✅ Content found in Pinata pin list');
            
            // Try Pinata's dedicated gateway with authentication
            try {
              console.log('🔑 Strategy 2a: Using authenticated Pinata gateway...');
              const authResponse = await fetch(`${this.pinataGateway}/ipfs/${cid}`, {
                headers: {
                  'Authorization': `Bearer ${this.pinataJWT}`,
                  'Accept': 'application/json, text/plain, */*',
                },
              });
              
              if (authResponse.ok) {
                const content = await authResponse.text();
                console.log(`✅ Successfully downloaded via authenticated Pinata gateway`);
                return content;
              }
            } catch (error) {
              console.warn('⚠️ Authenticated Pinata gateway failed:', error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Pinata API check failed:', error);
      }
    }

    // Strategy 3: Try CORS-friendly gateways with specific headers
    console.log('🌐 Strategy 3: Trying CORS-optimized gateways...');
    const corsOptimizedGateways = [
      // Pinata public gateway (no auth, but CORS-friendly)
      { url: `${this.pinataGateway}/ipfs/${cid}`, name: 'Pinata Public' },
      // Cloudflare IPFS (good CORS support)
      { url: `https://cloudflare-ipfs.com/ipfs/${cid}`, name: 'Cloudflare' },
      // Dweb.link (designed for browsers)
      { url: `https://dweb.link/ipfs/${cid}`, name: 'Dweb.link' },
      // IPFS.io with different subdomain (sometimes works better)
      { url: `https://${cid}.ipfs.dweb.link`, name: 'Dweb.link Subdomain' },
    ];
    
    for (const gateway of corsOptimizedGateways) {
      try {
        console.log(`🔍 Trying ${gateway.name}: ${gateway.url}`);
        
        const response = await Promise.race([
          fetch(gateway.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Cache-Control': 'no-cache',
              'User-Agent': 'Mozilla/5.0 (compatible; TimeCapsule/1.0)',
            },
            mode: 'cors',
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000)
          )
        ]);
        
        if (response.ok) {
          const content = await response.text();
          console.log(`✅ Successfully downloaded from ${gateway.name}`);
          console.log(`📄 Content length: ${content.length} chars`);
          return content;
        } else {
          console.warn(`❌ ${gateway.name} returned ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`❌ ${gateway.name} failed:`, error);
      }
    }

    // Strategy 4: Try alternative access methods
    console.log('🔄 Strategy 4: Trying alternative methods...');
    
    // Try with different request modes
    const alternativeMethods = [
      { mode: 'no-cors', name: 'No-CORS mode' },
      { mode: 'same-origin', name: 'Same-origin mode' },
    ];
    
    for (const method of alternativeMethods) {
      try {
        console.log(`🔍 Trying ${method.name} with Pinata gateway...`);
        const response = await fetch(`${this.pinataGateway}/ipfs/${cid}`, {
          method: 'GET',
          mode: method.mode as RequestMode,
          headers: {
            'Accept': '*/*',
          },
        });
        
        if (response.ok) {
          const content = await response.text();
          console.log(`✅ Successfully downloaded using ${method.name}`);
          return content;
        }
      } catch (error) {
        console.warn(`❌ ${method.name} failed:`, error);
      }
    }
    
    // If all strategies fail, provide comprehensive error message
    const helpfulError = `IPFS download failed after trying multiple strategies:

CID: ${cid}

Attempted strategies:
1. ✗ CORS proxy services (3 different proxies)
2. ✗ Pinata authenticated API
3. ✗ CORS-optimized gateways (4 different gateways)
4. ✗ Alternative request modes

This is likely due to:
- CORS restrictions from all IPFS gateways
- Content not fully propagated across IPFS network
- Network connectivity issues

Solutions to try:
1. Wait 5-10 minutes for better IPFS propagation
2. Try accessing the content directly: ${this.pinataGateway}/ipfs/${cid}
3. Use a different browser or disable CORS temporarily for testing
4. Upload content again and try immediately

The content exists on IPFS but browser CORS policies are preventing access.`;

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

  // Check if content exists on IPFS (without downloading it)
  async checkContentExists(cid: string): Promise<{ exists: boolean; gateways: Array<{ name: string; url: string; status: string }> }> {
    if (cid.startsWith('local_')) {
      const exists = localStorage.getItem(`ipfs_${cid}`) !== null;
      return {
        exists,
        gateways: [{ name: 'localStorage', url: `local://${cid}`, status: exists ? 'available' : 'not found' }]
      };
    }

    const gateways = [
      { name: 'Pinata Gateway', url: `${this.pinataGateway}/ipfs/${cid}` },
      { name: 'IPFS.io Gateway', url: `https://ipfs.io/ipfs/${cid}` },
      { name: 'Cloudflare Gateway', url: `https://cloudflare-ipfs.com/ipfs/${cid}` },
      { name: 'Dweb.link Gateway', url: `https://dweb.link/ipfs/${cid}` },
    ];

    const results = [];
    let anyExists = false;

    for (const gateway of gateways) {
      try {
        const response = await fetch(gateway.url, { 
          method: 'HEAD', // Just check if it exists without downloading
          mode: 'no-cors',
        });
        
        const status = response.ok ? 'available' : `error ${response.status}`;
        if (response.ok) anyExists = true;
        
        results.push({
          name: gateway.name,
          url: gateway.url,
          status: status,
        });
      } catch (error) {
        results.push({
          name: gateway.name,
          url: gateway.url,
          status: 'cors_blocked',
        });
      }
    }

    return { exists: anyExists, gateways: results };
  }

  // Alternative download method that suggests external access
  async downloadWithFallbacks(cid: string): Promise<{ content?: string; suggestions: string[] }> {
    const suggestions: string[] = [];

    try {
      const content = await this.download(cid);
      return { content, suggestions: [] };
    } catch (error) {
      console.warn('Standard download failed, providing alternatives:', error);
      
      suggestions.push(`🌐 Try opening directly: ${this.pinataGateway}/ipfs/${cid}`);
      suggestions.push(`🔧 Copy this URL and open in a new tab: https://ipfs.io/ipfs/${cid}`);
      suggestions.push(`💻 Or use curl/wget: curl "${this.pinataGateway}/ipfs/${cid}"`);
      
      if (this.pinataJWT) {
        suggestions.push(`🔑 Try authenticated Pinata: curl -H "Authorization: Bearer YOUR_JWT" "${this.pinataGateway}/ipfs/${cid}"`);
      }

      return { suggestions };
    }
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