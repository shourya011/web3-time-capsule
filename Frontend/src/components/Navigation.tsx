import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket, Wallet, ChevronDown, LogOut, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useEnsName, useDisconnect } from 'wagmi';
import { formatAddress } from '@/lib/ens';
import { baseSepolia } from 'wagmi/chains';
import { clearWalletStorage } from '@/config/wagmi';
import { DisconnectTroubleshooter } from '@/components/DisconnectTroubleshooter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const Navigation = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
  });
  
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Social', path: '/social' },
    { name: 'Search', path: '/search' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Wallet address has been copied to clipboard.",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      // Use wagmi disconnect
      disconnect();
      
      // Clear wallet storage using our utility function
      clearWalletStorage();
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been successfully disconnected.",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect failed",
        description: "There was an issue disconnecting your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleForceDisconnect = () => {
    // Force disconnect by clearing all storage and reloading
    clearWalletStorage();
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Force disconnect",
      description: "All wallet data cleared. Refreshing page...",
    });
    
    // Small delay for toast to show
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getNetworkBadge = () => {
    if (!isConnected) return null;
    
    const isCorrectNetwork = chainId === baseSepolia.id;
    
    return (
      <Badge 
        variant={isCorrectNetwork ? "default" : "destructive"}
        className="ml-2"
      >
        {isCorrectNetwork ? "Base Sepolia" : "Wrong Network"}
      </Badge>
    );
  };

  const CustomConnectButton = () => {
    return (
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button 
                      onClick={openConnectModal} 
                      className="cosmic-glow bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    {getNetworkBadge()}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="border-primary/50 hover:bg-primary/10 hover:border-primary flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4" />
                          {formatAddress(account.address, ensName)}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={copyAddress}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openAccountModal}>
                          <Wallet className="w-4 h-4 mr-2" />
                          Account Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openChainModal}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Switch Network
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDisconnect}
                          className="text-destructive"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Disconnect Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleForceDisconnect()}
                          className="text-destructive"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Force Disconnect
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DisconnectTroubleshooter
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <HelpCircle className="w-4 h-4 mr-2" />
                              Disconnect Help
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="w-8 h-8 text-primary" />
            <span className="text-2xl font-heading font-bold text-gradient">
              Time Capsule
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-foreground/80 hover:text-foreground transition-colors ${
                  location.pathname === item.path ? 'text-primary font-semibold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
            {location.pathname === '/' && (
              <>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  About Us
                </button>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {isConnected && (
              <Link to="/profile">
                <Button variant="ghost" className="hover:text-primary">
                  Profile
                </Button>
              </Link>
            )}
            <CustomConnectButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
