# 🚀 Web3 Time Capsule

A decentralized application that allows users to preserve memories, ideas, and messages for the future using blockchain technology and client-side encryption.

## ✨ Features

### 🔐 **Security & Privacy**
- **Client-side AES-GCM encryption** - Content never leaves your device unencrypted
- **Recovery Kit system** - Secure key management for capsule access
- **Blockchain immutability** - Tamper-proof storage and timestamping
- **ENS integration** - Human-readable addresses with .eth domains

### 📦 **Time Capsule Creation**
- **Multi-step creation flow** - Intuitive 5-step process
- **Multiple file types** - Text, images, audio, video, and documents
- **Flexible unlock times** - Custom dates or preset durations (1, 5, 10 years)
- **Recipient management** - Add wallet addresses or ENS names for shared access

### 🌐 **Web3 Integration**
- **Wallet connectivity** - MetaMask, WalletConnect, and more via RainbowKit
- **Base Sepolia network** - Low-cost transactions on Ethereum L2
- **Wrong network detection** - Automatic prompts to switch networks
- **ENS resolution** - Display names instead of hex addresses

### 💎 **User Experience**
- **Cosmic design** - Space-inspired UI with glass morphism effects
- **Real-time countdowns** - Track time until capsule unlock
- **Dashboard management** - Grid/list views of your capsules
- **Mobile responsive** - Works seamlessly on all devices

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Shadcn/ui** for consistent component library

### **Web3**
- **wagmi** - React hooks for Ethereum
- **viem** - Low-level Ethereum utilities
- **RainbowKit** - Beautiful wallet connection UI
- **ENS integration** - Name resolution and formatting

### **Security**
- **Web Crypto API** - Browser-native AES-GCM encryption
- **Client-side encryption** - Zero-knowledge content protection
- **Recovery Kit generation** - Secure backup system

### **Storage**
- **IPFS integration** - Decentralized file storage
- **Mock services** - Ready for production API integration
- **Local storage** - Temporary key management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Web3 wallet (MetaMask recommended)
- Base Sepolia testnet ETH for transactions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-capsule
   ```

2. **Install dependencies**
   ```bash
   cd Frontend
   npm install
   # or
   bun install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

### Network Setup
1. Add Base Sepolia to your wallet:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.basescan.org

2. Get testnet ETH from the [Base Sepolia faucet](https://bridge.base.org/deposit)

## 📱 Usage

### Creating a Time Capsule

1. **Connect Wallet** - Click "Connect Wallet" and select your preferred wallet
2. **Enter Details** - Provide a title and description for your capsule
3. **Upload Content** - Add files or text you want to preserve
4. **Set Unlock Time** - Choose when the capsule can be opened
5. **Add Recipients** - Optionally add wallet addresses for shared access
6. **Encrypt & Submit** - Content is encrypted locally before blockchain submission

### Managing Capsules

- **Dashboard** - View all your time capsules with status indicators
- **Countdown Timers** - See how much time remains until unlock
- **Grid/List Views** - Switch between different layout options
- **Status Tracking** - Monitor locked/unlocked states

### Accessing Capsules

- **Automatic Unlock** - Capsules become accessible after unlock time
- **Recovery Kit** - Use your saved recovery kit to decrypt content
- **Share Links** - Send capsule links to recipients
- **Content Download** - Save decrypted files locally

## 🏗️ Project Structure

```
time-capsule/
├── Frontend/                 # Main React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   ├── Navigation.tsx
│   │   │   ├── SpaceBackground.tsx
│   │   │   └── ...
│   │   ├── pages/          # Application pages
│   │   │   ├── CreateCapsule.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Home.tsx
│   │   │   └── ...
│   │   ├── lib/            # Utility libraries
│   │   │   ├── contract.ts  # Smart contract adapter
│   │   │   ├── crypto.ts    # Encryption utilities
│   │   │   ├── ipfs.ts      # IPFS integration
│   │   │   ├── ens.ts       # ENS utilities
│   │   │   └── utils.ts
│   │   ├── config/         # Configuration files
│   │   │   └── wagmi.ts    # Web3 configuration
│   │   └── hooks/          # Custom React hooks
│   └── ...
├── docs/                    # Project documentation
│   ├── web3-time-capsule-prd.md
│   └── frontend-design-specification.md
└── README.md               # This file
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Key Components

- **Navigation** - Wallet connection and app navigation
- **CreateCapsule** - Multi-step time capsule creation
- **Dashboard** - Capsule management interface
- **SpaceBackground** - Animated cosmic background
- **WrongNetworkBanner** - Network detection and switching

### Configuration

- **Wagmi Config** - Web3 provider setup in `src/config/wagmi.ts`
- **Tailwind** - Styling configuration in `tailwind.config.ts`
- **Vite** - Build configuration in `vite.config.ts`

## 🛡️ Security Features

### Client-Side Encryption
- AES-GCM 256-bit encryption
- Cryptographically secure random key generation
- Recovery kit backup system
- Zero-knowledge architecture

### Blockchain Security
- Immutable timestamp proof
- Tamper-evident storage
- Decentralized verification
- Smart contract interaction

### Privacy Protection
- Content encrypted before upload
- Private key management
- Optional ENS privacy
- No personal data collection

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:

- **Vercel** (recommended)
- **Netlify**
- **IPFS**
- **GitHub Pages**

### Environment Variables
```env
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [docs/](docs/)
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Bridge**: https://bridge.base.org

## 💡 Future Enhancements

- [ ] Smart contract deployment and integration
- [ ] Real IPFS storage implementation
- [ ] Mobile app development
- [ ] Advanced encryption options
- [ ] Social features and sharing
- [ ] Multi-chain support
- [ ] NFT integration for capsule ownership

## 📞 Support

If you have questions or need help:

1. Check the [documentation](docs/)
2. Open an [issue](../../issues)
3. Join our community discussions

---

**Built with ❤️ for the future** 🌟