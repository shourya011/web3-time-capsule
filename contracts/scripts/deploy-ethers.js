import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying TimeCapsule contract...");
  
  // Get the contract factory
  const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
  
  // Get the first signer (deployer)
  const [deployer] = await ethers.getSigners();
  const treasury = deployer.address; // Use deployer as treasury for testing
  
  console.log("Deploying with account:", deployer.address);
  console.log("Treasury address:", treasury);
  
  // Deploy the contract
  console.log("📝 Deploying TimeCapsule...");
  const timeCapsule = await TimeCapsule.deploy(treasury);
  
  // Wait for deployment to be mined
  await timeCapsule.deployed();
  
  console.log("✅ TimeCapsule deployed to:", timeCapsule.address);
  
  // Read contract data
  const protocolFee = await timeCapsule.protocolFee();
  const contractTreasury = await timeCapsule.treasury();
  const totalCapsules = await timeCapsule.totalCapsules();
  
  console.log("\n📊 Contract Details:");
  console.log("- Protocol fee:", ethers.utils.formatEther(protocolFee), "ETH");
  console.log("- Treasury:", contractTreasury);
  console.log("- Total capsules:", totalCapsules.toString());
  
  console.log("\n📄 Copy this for your frontend:");
  console.log("CONTRACT_ADDRESS =", timeCapsule.address);
  
  return {
    address: timeCapsule.address,
    deployer: deployer.address,
    treasury: treasury
  };
}

// Run the deployment
main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Contract address:", result.address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });