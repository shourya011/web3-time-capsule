// IPFS Demo Component - Test IPFS Integration
import React, { useState } from 'react';
import { ipfsService } from '../lib/ipfs';
import { cryptoService } from '../lib/crypto';
import { BrowserBuffer } from '../lib/browserBuffer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function IPFSDemo() {
  const [content, setContent] = useState('');
  const [uploadResult, setUploadResult] = useState<{cid: string; url: string; size: number} | null>(null);
  const [downloadResult, setDownloadResult] = useState('');
  const [cid, setCid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [manualContent, setManualContent] = useState(''); // For manual content bridge

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

    const testIPFSUpload = async () => {
    setIsLoading(true);
    try {
      if (!content.trim()) {
        addTestResult('❌ Please enter some content to upload');
        return;
      }

      addTestResult('� Starting IPFS upload...');
      addTestResult(`📄 Content: "${content}" (${content.length} characters)`);
      
      const result = await ipfsService.uploadString(content, 'test-content.txt');
      
      addTestResult(`✅ Upload successful!`);
      addTestResult(`📋 CID: ${result.cid}`);
      addTestResult(`🔗 Gateway URL: ${result.gatewayUrl}`);
      addTestResult(`� Size: ${result.size} bytes`);
      addTestResult(`�️ Method: ${result.method}`);
      
      setUploadResult(result);
      setCid(result.cid); // Auto-fill CID for download test
      
    } catch (error) {
      addTestResult(`❌ Upload failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testIPFSDownload = async () => {
    if (!cid) {
      addTestResult('❌ No CID to download from');
      return;
    }

    setIsLoading(true);
    try {
      addTestResult(`📥 Downloading from CID: ${cid}`);
      
      const result = await ipfsService.download(cid);
      setDownloadResult(result);
      
      addTestResult(`✅ Download successful!`);
      addTestResult(`📄 Content: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
    } catch (error) {
      addTestResult(`❌ Download failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testEncryptionIPFS = async () => {
    setIsLoading(true);
    try {
      addTestResult('🔐 Testing encryption + IPFS workflow...');
      
      // Step 1: Encrypt content
      const testContent = content || 'Secret time capsule content!';
      const encrypted = await cryptoService.encrypt(testContent);
      addTestResult('✅ Content encrypted');

      // Step 2: Upload encrypted content to IPFS
      const encryptedB64 = BrowserBuffer.arrayBufferToBase64(encrypted.encryptedContent);
      const capsuleData = {
        encryptedContent: encryptedB64,
        metadata: {
          title: 'Test Capsule',
          createdAt: Date.now(),
        }
      };

      const uploadResult = await ipfsService.uploadJSON(capsuleData, 'encrypted-capsule.json');
      addTestResult(`✅ Encrypted data uploaded to IPFS: ${uploadResult.cid}`);

      // Step 3: Download and decrypt
      const downloadedData = await ipfsService.downloadJSON(uploadResult.cid);
      addTestResult('✅ Encrypted data downloaded from IPFS');

      const encryptedBuffer = BrowserBuffer.base64ToArrayBuffer((downloadedData as {encryptedContent: string}).encryptedContent);
      const decrypted = await cryptoService.decrypt(encryptedBuffer, encrypted.key, encrypted.iv);
      
      addTestResult(`✅ Content decrypted: "${decrypted}"`);
      addTestResult('🎉 Full encryption + IPFS workflow successful!');

    } catch (error) {
      addTestResult(`❌ Encryption + IPFS test failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testIPFSAvailability = async () => {
    setIsLoading(true);
    try {
      addTestResult('🔍 Checking IPFS service availability...');
      const isAvailable = await ipfsService.isAvailable();
      addTestResult(`📡 IPFS Service: ${isAvailable ? '✅ Pinata Connected' : '❌ Pinata Not Available'}`);
      
      if (isAvailable) {
        addTestResult('🔑 Pinata JWT token is working!');
        
        // Get storage info
        const storageInfo = await ipfsService.getStorageInfo();
        const usedMB = (storageInfo.used / (1024 * 1024)).toFixed(2);
        const limitMB = (storageInfo.limit / (1024 * 1024)).toFixed(0);
        addTestResult(`💾 Storage Used: ${usedMB}MB / ${limitMB}MB (${storageInfo.method})`);
      } else {
        addTestResult('⚠️ Will use localStorage fallback for testing');
      }
    } catch (error) {
      addTestResult(`❌ Availability check failed: ${error}`);
    }
    setIsLoading(false);
  };

  const testCIDValidation = async () => {
    setIsLoading(true);
    try {
      addTestResult('🔍 Testing CID validation and download...');
      
      if (!cid.trim()) {
        addTestResult('❌ Please enter a CID to test');
        return;
      }

      addTestResult(`📋 Testing CID: ${cid}`);
      
      // Check CID format
      if (cid.startsWith('local_')) {
        addTestResult('🏠 Detected local storage CID');
      } else if (cid.startsWith('Qm') || cid.startsWith('bafy') || cid.startsWith('bafk')) {
        addTestResult('✅ CID format looks valid (IPFS v0 or v1 format)');
      } else {
        addTestResult('⚠️ Warning: CID format might be invalid');
      }

      // First, check if content exists
      addTestResult('🔍 Checking content availability across gateways...');
      const availability = await ipfsService.checkContentExists(cid);
      
      availability.gateways.forEach(gateway => {
        const statusIcon = gateway.status === 'available' ? '✅' : 
                          gateway.status === 'cors_blocked' ? '🚫' : '❌';
        addTestResult(`  ${statusIcon} ${gateway.name}: ${gateway.status}`);
      });

      // Try to download with fallbacks
      addTestResult('📥 Attempting download with enhanced CORS handling...');
      addTestResult('⏳ This may take 15-30 seconds for recently uploaded content...');
      
      const downloadResult = await ipfsService.downloadWithFallbacks(cid);
      
      if (downloadResult.content) {
        addTestResult(`✅ Download successful! Content length: ${downloadResult.content.length} characters`);
        addTestResult(`📄 Content preview: ${downloadResult.content.slice(0, 200)}${downloadResult.content.length > 200 ? '...' : ''}`);
        setDownloadResult(downloadResult.content);
      } else {
        addTestResult(`❌ Download blocked by CORS restrictions`);
        addTestResult(`💡 Alternative access methods:`);
        downloadResult.suggestions.forEach(suggestion => {
          addTestResult(`   ${suggestion}`);
        });
      }
      
    } catch (error) {
      addTestResult(`❌ CID test failed: ${error}`);
      
      // Provide helpful suggestions based on error type
      const errorStr = String(error);
      if (errorStr.includes('CORS')) {
        addTestResult('💡 Tip: CORS error - try the "Direct Gateway Test" button');
      } else if (errorStr.includes('404') || errorStr.includes('Not Found')) {
        addTestResult('💡 Tip: Content not found - wait for IPFS network propagation (2-5 minutes)');
      } else if (errorStr.includes('Load failed')) {
        addTestResult('💡 Tip: Network/CORS issue - try "Direct Gateway Test" button');
      }
    }
    setIsLoading(false);
  };

  const waitForIPFSPropagation = async () => {
    setIsLoading(true);
    try {
      if (!cid.trim()) {
        addTestResult('❌ Please enter a CID first');
        return;
      }

      addTestResult('⏳ Waiting for IPFS propagation...');
      addTestResult('🌐 IPFS content can take 2-5 minutes to propagate across gateways');
      
      // Wait 3 minutes with progress updates
      for (let i = 30; i >= 0; i--) {
        if (i % 6 === 0) { // Update every 30 seconds
          addTestResult(`⏱️ Waiting... ${i * 6} seconds remaining`);
        }
        await new Promise(resolve => setTimeout(resolve, 6000)); // 6 second intervals
      }
      
      addTestResult('✅ Wait complete! Try downloading now...');
      
    } catch (error) {
      addTestResult(`❌ Wait interrupted: ${error}`);
    }
    setIsLoading(false);
  };

  const testDirectGatewayAccess = () => {
    if (!cid.trim()) {
      addTestResult('❌ Please enter a CID first');
      return;
    }

    if (cid.startsWith('local_')) {
      addTestResult('❌ Local storage CIDs cannot be accessed via gateway');
      return;
    }

    addTestResult('🌐 Opening direct gateway links in new tabs...');
    
    const gateways = [
      { name: 'Pinata Gateway', url: `https://gateway.pinata.cloud/ipfs/${cid}` },
      { name: 'IPFS.io Gateway', url: `https://ipfs.io/ipfs/${cid}` },
      { name: 'Cloudflare Gateway', url: `https://cloudflare-ipfs.com/ipfs/${cid}` },
      { name: 'Dweb.link Gateway', url: `https://dweb.link/ipfs/${cid}` },
    ];

    gateways.forEach(gateway => {
      addTestResult(`🔗 ${gateway.name}: ${gateway.url}`);
      window.open(gateway.url, '_blank');
    });

    addTestResult('💡 Check the opened tabs - if content loads, IPFS works but CORS is blocking the app');
    addTestResult('📋 If you can see content, copy it and use "Manual Content Bridge" below');
  };

  const useManualContentBridge = () => {
    if (!cid.trim()) {
      addTestResult('❌ Please enter a CID first');
      return;
    }

    if (!manualContent.trim()) {
      addTestResult('❌ Please paste the content from the gateway tabs');
      return;
    }

    try {
      addTestResult('🔄 Using manual content bridge...');
      
      // Store the manually pasted content as if it was downloaded
      setDownloadResult(manualContent);
      addTestResult(`✅ Content bridged successfully! Length: ${manualContent.length} characters`);
      addTestResult(`📄 Content preview: ${manualContent.slice(0, 200)}${manualContent.length > 200 ? '...' : ''}`);
      
      // Optionally store in localStorage for future reference
      localStorage.setItem(`ipfs_manual_${cid}`, manualContent);
      addTestResult(`💾 Content cached locally for CID: ${cid}`);
      
    } catch (error) {
      addTestResult(`❌ Manual bridge failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setUploadResult(null);
    setDownloadResult('');
    setCid('');
  };

  const showLocalStorageContents = () => {
    setIsLoading(true);
    try {
      addTestResult('🔍 Checking localStorage contents...');
      
      const ipfsItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ipfs_')) {
          const value = localStorage.getItem(key);
          ipfsItems.push({
            key,
            size: value?.length || 0,
            preview: value?.slice(0, 50) + '...'
          });
        }
      }

      if (ipfsItems.length === 0) {
        addTestResult('📭 No IPFS items found in localStorage');
      } else {
        addTestResult(`📋 Found ${ipfsItems.length} IPFS items in localStorage:`);
        ipfsItems.forEach(item => {
          const cid = item.key.replace('ipfs_', '');
          addTestResult(`  • CID: ${cid} (${item.size} chars)`);
        });
      }
    } catch (error) {
      addTestResult(`❌ Failed to check localStorage: ${error}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          IPFS Integration Test
        </h1>
        <p className="text-gray-600 mt-2">Test real IPFS upload, download, and encryption workflows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input & Controls</CardTitle>
            <CardDescription>Enter content to test IPFS operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content to upload to IPFS..."
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">CID (for download test)</label>
              <Input
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="Enter IPFS CID to download..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Manual Content Bridge (CORS Workaround)</label>
              <Textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste content from gateway tabs here to bypass CORS..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Use "Direct Gateway Test" → copy content from tabs → paste here → click "Bridge Content"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={testIPFSAvailability} disabled={isLoading} variant="outline">
                Check IPFS
              </Button>
              <Button onClick={testCIDValidation} disabled={isLoading || !cid} variant="outline">
                Validate CID
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={waitForIPFSPropagation} disabled={isLoading || !cid} variant="outline">
                Wait for IPFS
              </Button>
              <Button onClick={testDirectGatewayAccess} disabled={!cid} variant="outline">
                Direct Gateway Test
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={useManualContentBridge} disabled={!cid || !manualContent} variant="outline" className="bg-green-50 hover:bg-green-100">
                Bridge Content
              </Button>
              <Button onClick={showLocalStorageContents} disabled={isLoading} variant="outline">
                Show Storage
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={testIPFSUpload} disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload to IPFS'}
              </Button>
              <Button onClick={testIPFSDownload} disabled={isLoading || !cid}>
                Download from IPFS
              </Button>
              <Button onClick={testEncryptionIPFS} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600">
                Test Full Workflow (Encrypt + IPFS)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Real-time results from IPFS operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No tests run yet. Click a button to start testing...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">{result}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>CID:</strong> {uploadResult.cid}</p>
              <p><strong>URL:</strong> <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadResult.url}</a></p>
              <p><strong>Size:</strong> {uploadResult.size} bytes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Result */}
      {downloadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Downloaded Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{downloadResult}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}