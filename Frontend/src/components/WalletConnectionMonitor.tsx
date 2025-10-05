import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

export const WalletConnectionMonitor = () => {
  const { isConnected, address, status } = useAccount();
  const { connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  useEffect(() => {
    // Monitor wallet connection state
    console.log('Wallet State:', { isConnected, address, status });

    // Check for stuck connections
    if (status === 'connecting' && !isConnected) {
      // Connection might be stuck, offer to reset
      const timer = setTimeout(() => {
        toast({
          title: "Connection taking too long",
          description: "Click here to reset connection",
          action: (
            <button onClick={() => window.location.reload()}>
              Reset
            </button>
          ),
        });
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }

    // Handle disconnection events
    if (!isConnected && status === 'disconnected') {
      // Clear any residual data
      const keysToCheck = ['wagmi.', 'rainbowkit.', 'wc@2:'];
      keysToCheck.forEach(prefix => {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      });
    }
  }, [isConnected, address, status, toast]);

  // Check for wallet extension issues
  useEffect(() => {
    const checkWalletExtensions = () => {
      const metamaskInstalled = typeof window.ethereum !== 'undefined';
      const walletConnectAvailable = connectors.some(c => c.name === 'WalletConnect');
      
      console.log('Wallet Extensions:', {
        metamaskInstalled,
        walletConnectAvailable,
        connectors: connectors.map(c => ({ name: c.name, ready: c.ready }))
      });
    };

    checkWalletExtensions();
  }, [connectors]);

  // This component doesn't render anything - it's just for monitoring
  return null;
};