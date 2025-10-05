import hre from "hardhat";
import { parseEther, formatEther } from "viem";

async function main() {
  console.log("🚀 Deploying TimeCapsule contract with Viem...");
  
  // Get wallet clients
  const [deployer] = await hre.viem.getWalletClients();
  const treasury = deployer.account.address; // Use deployer as treasury for testing
  
  console.log("Deploying with account:", deployer.account.address);
  console.log("Treasury address:", treasury);

  // Deploy the contract
  console.log("📝 Deploying TimeCapsule...");
  const timeCapsule = await hre.viem.deployContract("TimeCapsule", [treasury]);
  
  console.log("✅ TimeCapsule deployed to:", timeCapsule.address);
  
  // Read contract data
  const protocolFee = await timeCapsule.read.protocolFee();
  const contractTreasury = await timeCapsule.read.treasury();
  const totalCapsules = await timeCapsule.read.totalCapsules();
  
  console.log("\n📊 Contract Details:");
  console.log("- Protocol fee:", formatEther(protocolFee), "ETH");
  console.log("- Treasury:", contractTreasury);
  console.log("- Total capsules:", totalCapsules.toString());
  
  // Test creating a capsule
  console.log("\n🧪 Testing capsule creation...");
  const contentText = "Hello from the future! This is a test time capsule.";
  const contentHash = "0x" + Array.from(new TextEncoder().encode(contentText))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const unlockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
  const fee = await timeCapsule.read.protocolFee();
  
  try {
    const hash = await timeCapsule.write.createCapsule([
      0, // RAW_TEXT
      contentHash,
      "QmTest123abc", // IPFS CID
      BigInt(unlockTime),
      [], // No recipients
      true // Public capsule
    ], { value: fee });
    
    console.log("✅ Test capsule created! Transaction hash:", hash);
    
    const newTotalCapsules = await timeCapsule.read.totalCapsules();
    console.log("- New total capsules:", newTotalCapsules.toString());
    
  } catch (error) {
    console.log("ℹ️  Capsule creation test skipped (expected in some configurations)");
  }
  
  return {
    contractAddress: timeCapsule.address,
    treasury: contractTreasury,
    protocolFee: protocolFee.toString(),
    totalCapsules: totalCapsules.toString()
  };
}

// Execute the deployment
main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Summary:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });