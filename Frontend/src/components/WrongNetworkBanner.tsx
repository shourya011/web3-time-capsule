import { Alert, AlertDescription } from '@/components/ui/alert';
import { CosmicButton } from '@/components/CosmicButton';
import { AlertTriangle, Wifi } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { motion, AnimatePresence } from 'framer-motion';

const WrongNetworkBanner = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Only show if wallet is connected and not on Base Sepolia
  const shouldShow = isConnected && chainId !== baseSepolia.id;

  const handleSwitchNetwork = () => {
    switchChain({ chainId: baseSepolia.id });
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Alert className="max-w-4xl mx-auto bg-yellow-500/10 border-yellow-500/50 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 font-medium">
                  Wrong Network Detected
                </span>
                <span className="text-muted-foreground">
                  Please switch to Base Sepolia to use Time Capsule
                </span>
              </div>
              <CosmicButton
                onClick={handleSwitchNetwork}
                disabled={isPending}
                size="sm"
                className="ml-4"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Switching...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Switch to Base Sepolia
                  </>
                )}
              </CosmicButton>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WrongNetworkBanner;