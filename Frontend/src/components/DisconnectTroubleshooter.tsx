import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDisconnect } from 'wagmi';
import { clearWalletStorage } from '@/config/wagmi';
import { useToast } from '@/hooks/use-toast';

interface DisconnectTroubleshooterProps {
  trigger?: React.ReactNode;
}

export const DisconnectTroubleshooter = ({ trigger }: DisconnectTroubleshooterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'trying' | 'force' | 'success'>('initial');
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const handleNormalDisconnect = async () => {
    setStep('trying');
    try {
      disconnect();
      clearWalletStorage();
      setStep('success');
      toast({
        title: "Disconnected successfully",
        description: "Your wallet has been disconnected.",
      });
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error('Disconnect failed:', error);
      setStep('force');
    }
  };

  const handleForceDisconnect = () => {
    // Clear all storage
    clearWalletStorage();
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Force disconnect initiated",
      description: "Clearing all data and refreshing page...",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const resetSteps = () => {
    setStep('initial');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Helper
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            Wallet Disconnect Troubleshooter
          </DialogTitle>
          <DialogDescription>
            Having trouble disconnecting your wallet? Let's fix that.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'initial' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If your wallet isn't disconnecting properly, try these steps in order.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button onClick={handleNormalDisconnect} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Try Normal Disconnect
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  This will attempt to disconnect using the standard method and clear wallet storage.
                </p>
              </div>
            </>
          )}

          {step === 'trying' && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Attempting to disconnect...</p>
            </div>
          )}

          {step === 'force' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Normal disconnect didn't work. Let's try a force disconnect.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button onClick={handleForceDisconnect} variant="destructive" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Force Disconnect & Refresh
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  This will clear all browser storage and reload the page.
                </p>
                
                <Button onClick={resetSteps} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium">Successfully disconnected!</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Still having issues?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Try disconnecting from your wallet extension directly</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Restart your browser</li>
            <li>• Check if your wallet is locked</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};