import hre from "hardhat";
import { formatEther } from "viem";

async function main() {
  console.log("🚀 Deploying TimeCapsule contract with Viem...");
  
  // Get wallet clients using the correct Hardhat v3 syntax
  const walletClient = await hre.viem.getWalletClient();
  const treasury = walletClient.account.address; // Use deployer as treasury for testing
  
  console.log("Deploying with account:", walletClient.account.address);
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

// Execute the deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment completed successfully!");
    console.log("Contract addresses:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });