// Simple manual deployment script
import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function checkConnection() {
  console.log("🔍 Checking connection to Base Sepolia...");
  
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    return;
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("📍 Wallet address:", wallet.address);
  
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("⚠️  No ETH balance. Please get testnet ETH from:");
      console.log("   - https://faucet.quicknode.com/base/sepolia");
      console.log("   - https://www.alchemy.com/faucets/base-sepolia");
      return;
    }
    
    const network = await provider.getNetwork();
    console.log("🌐 Connected to network:", network.name, "Chain ID:", network.chainId);
    
    if (network.chainId === 84532n) {
      console.log("✅ Successfully connected to Base Sepolia!");
      console.log("💡 You have enough ETH for deployment.");
      console.log("\n📋 Next steps:");
      console.log("   1. Use Remix IDE for easier deployment: https://remix.ethereum.org");
      console.log("   2. Deploy the TimeCapsule contract with treasury address");
      console.log("   3. Update frontend with contract address");
      console.log("\n🏗️  Alternative: Use Remix IDE deployment:");
      console.log("   - Copy your contract code to Remix");
      console.log("   - Connect Remix to Base Sepolia");
      console.log("   - Deploy with constructor parameter:", "0x742d35Cc6639C10532BfeD48c4F4B8a2c857Fd3e");
    }
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

checkConnection();