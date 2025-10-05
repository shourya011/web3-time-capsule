# TimeCapsule Smart Contract

A Solidity smart contract for creating time-locked digital capsules on the blockchain.

## Features

- **Time-Locked Capsules**: Create capsules that can only be unlocked after a specified time
- **Access Control**: Private capsules with specific recipients or public capsules
- **Content Types**: Support for raw text, files, and encrypted content
- **Hash Verification**: Ensure content integrity with cryptographic hashing
- **Protocol Fees**: Configurable fees for capsule creation
- **Event Emission**: Comprehensive event logging for all operations

## Contract Architecture

### Core Types

- `CapsuleType`: RAW_TEXT, FILE, ENCRYPTED
- `CapsuleStatus`: LOCKED, UNLOCKED, REVEALED

### Main Functions

- `createCapsule()`: Create a new time-locked capsule
- `unlockCapsule()`: Unlock a capsule after the unlock time
- `revealCapsule()`: Reveal the content of an unlocked capsule
- `canAccessCapsule()`: Check if a user can access a capsule

### Admin Functions

- `setProtocolFee()`: Update the protocol fee (treasury only)
- `setTreasury()`: Update the treasury address (treasury only)

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm run test
```

### Local Deployment

```bash
npm run deploy:local
```

## Usage

### Creating a Capsule

```solidity
// Create a public text capsule
uint256 capsuleId = timeCapsule.createCapsule{value: protocolFee}(
    CapsuleType.RAW_TEXT,
    contentHash,
    "QmIPFSHash...",
    unlockTime,
    new address[](0), // no specific recipients
    true // public
);
```

### Unlocking and Revealing

```solidity
// After unlock time has passed
timeCapsule.unlockCapsule(capsuleId);

// Reveal the content
timeCapsule.revealCapsule(
    capsuleId,
    originalContent,
    "QmRevealedIPFSHash..."
);
```

## Security Considerations

- Content hashes are stored on-chain but actual content should be stored off-chain (IPFS)
- Private keys should never be stored in environment files in production
- Protocol fees are collected by the treasury address
- Only the capsule owner can unlock and reveal their capsules
- Recipients can view capsule metadata but cannot unlock capsules

## Gas Optimization

The contract is optimized for gas efficiency:
- Packed structs to minimize storage slots
- Efficient access control checks
- Event-driven architecture for off-chain indexing

## License

MIT License - see LICENSE file for details
