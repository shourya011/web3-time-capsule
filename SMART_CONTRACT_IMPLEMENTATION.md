# Smart Contract Implementation Steps

## Step 1: Deploy Smart Contract ✅ COMPLETED
- [x] TimeCapsule.sol contract exists and compiles
- [x] Hardhat configuration set up for Base Sepolia
- [x] Contract artifacts generated

**To complete deployment:**
```bash
# 1. Add your MetaMask private key to .env file
echo "PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE" > contracts/.env

# 2. Get Base Sepolia ETH from: https://bridge.base.org/deposit

# 3. Deploy to Base Sepolia
cd contracts && npx hardhat run scripts/deploy.ts --network baseSepolia

# 4. Copy the deployed contract address to Frontend/src/config/contracts.ts
```

## Step 2: Configure Contract Constants ✅ COMPLETED
- [x] Created `Frontend/src/config/contracts.ts` with network configurations
- [x] Created `Frontend/src/config/abi.ts` with contract ABI
- [x] Set up contract address management

## Step 3: Replace Mock Contract Adapter ✅ COMPLETED
- [x] Replaced `Frontend/src/lib/contract.ts` with real Wagmi hooks
- [x] Added `useProtocolFee()`, `useTotalCapsules()`, `useUserCapsules()` hooks
- [x] Added `useCreateCapsule()` write hook
- [x] Maintained backward compatibility

## Step 4: Update Frontend Components 🔄 IN PROGRESS

### 4a. Update CreateCapsule.tsx
```typescript
// Replace the mock contract call with real hooks
import { useCreateCapsule, useProtocolFee } from '../lib/contract';

export default function CreateCapsule() {
  const { createCapsule, isPending, error } = useCreateCapsule();
  const { data: protocolFee } = useProtocolFee();
  
  const handleSubmit = async (data: CreateCapsuleParams) => {
    try {
      const hash = await createCapsule(data);
      console.log('Transaction hash:', hash);
      // Show success message
    } catch (error) {
      console.error('Transaction failed:', error);
      // Show error message
    }
  };
}
```

### 4b. Update Dashboard.tsx
```typescript
// Use real contract hooks for fetching data
import { useUserCapsules, useTotalCapsules } from '../lib/contract';

export default function Dashboard() {
  const { address } = useAccount();
  const { data: userCapsules, isLoading } = useUserCapsules(address);
  const { data: totalCapsules } = useTotalCapsules();
  
  // Display real contract data
}
```

### 4c. Update CapsuleDetail.tsx
```typescript
// Use real contract hooks for capsule details
import { useCapsuleDetails } from '../lib/contract';

export default function CapsuleDetail({ id }: { id: string }) {
  const { data: capsule, isLoading } = useCapsuleDetails(id);
  
  // Display real capsule data from blockchain
}
```

## Step 5: Add Transaction Handling 🔄 PENDING

### 5a. Transaction Confirmation Component
```typescript
// Create TransactionStatus.tsx
export function TransactionStatus({ hash }: { hash: string }) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash });
  
  if (isLoading) return <div>Confirming transaction...</div>;
  if (receipt) return <div>Transaction confirmed!</div>;
  return <div>Transaction failed</div>;
}
```

### 5b. Error Handling
- Add proper error messages for contract rejections
- Handle network switching (user must be on Base Sepolia)
- Add loading states for all contract interactions

### 5c. Gas Estimation
```typescript
// Add gas estimation before transactions
const { data: gasEstimate } = useEstimateGas({
  address: CONTRACT_ADDRESS,
  abi: TIME_CAPSULE_ABI,
  functionName: 'createCapsule',
  args: [...],
});
```

## Step 6: Test Integration 🔄 PENDING

### 6a. Local Testing
1. Start local Hardhat node: `npx hardhat node`
2. Deploy contract locally: `npx hardhat run scripts/deploy.ts --network localhost`
3. Update `CONTRACT_ADDRESSES.localhost` with deployed address
4. Set `CURRENT_NETWORK = 'localhost'` in contracts.ts
5. Test all functions with MetaMask connected to localhost:8545

### 6b. Testnet Testing
1. Deploy to Base Sepolia
2. Update `CONTRACT_ADDRESSES.baseSepolia` with deployed address
3. Set `CURRENT_NETWORK = 'baseSepolia'` in contracts.ts
4. Test with real testnet ETH

### 6c. Integration Tests
- Create time capsule ✓
- View user capsules ✓
- Unlock capsule (after time passes) ✓
- Reveal capsule content ✓
- Check protocol fees ✓

## Required Files to Modify:

1. **contracts/.env** - Add your private key
2. **Frontend/src/config/contracts.ts** - Update contract addresses after deployment
3. **Frontend/src/pages/CreateCapsule.tsx** - Use real contract hooks
4. **Frontend/src/pages/Dashboard.tsx** - Use real contract hooks
5. **Frontend/src/pages/CapsuleDetail.tsx** - Use real contract hooks
6. **Frontend/src/config/wagmi.ts** - Ensure Base Sepolia is in chain list

## Network Configuration:

```typescript
// Add to wagmi.ts if not present
import { baseSepolia } from 'wagmi/chains';

export const chains = [mainnet, baseSepolia] as const;
```

## Testing Checklist:

- [ ] Contract deploys successfully
- [ ] Frontend connects to correct network
- [ ] Create capsule transactions work
- [ ] View capsules displays real data
- [ ] Unlock/reveal functions work
- [ ] Error handling works properly
- [ ] Loading states show correctly
- [ ] Transaction confirmations work

## Production Ready:

Once all tests pass:
1. Deploy to Base mainnet
2. Update contract address
3. Switch to mainnet in configuration
4. Verify contract on BaseScan
5. Test with small amounts first

## Estimated Time:
- Deployment: 30 minutes
- Frontend Updates: 2-3 hours  
- Testing & Debugging: 2-4 hours
- **Total: 4-7 hours**