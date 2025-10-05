import { motion } from 'framer-motion';
import { ExternalLink, Github, Twitter, Heart } from 'lucide-react';

export const Footer = () => {
  const contractAddress = "0x..."; // Replace with actual contract address
  const baseScanUrl = "https://sepolia.basescan.org";

  return (
    <footer className="relative border-t border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Project Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-gradient">
              Time Capsule
            </h3>
            <p className="text-sm text-muted-foreground">
              Preserve your memories for the future with blockchain technology and 
              client-side encryption.
            </p>
            <div className="flex items-center gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="/" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/create" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Create Capsule
                </a>
              </li>
              <li>
                <a 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="/how-it-works" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Network Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Network</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">
                Base Sepolia Testnet
              </li>
              <li>
                <a 
                  href="https://bridge.base.org/deposit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Get Testnet ETH
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.base.org/docs/network-information"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Network Info
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contract Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contract</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Smart Contract:</p>
                <a 
                  href={`${baseScanUrl}/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors font-mono text-xs inline-flex items-center gap-1"
                >
                  {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <a 
                  href={`${baseScanUrl}/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  View on BaseScan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Time Capsule. Built with ❤️ for the future.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Powered by Base & IPFS</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 fill-red-500 text-red-500" /> for Web3
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};