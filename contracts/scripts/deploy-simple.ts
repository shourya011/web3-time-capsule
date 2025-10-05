import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying TimeCapsule contract...");
  
  // Get the contract factory
  const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const treasury = deployer.address; // Use deployer as treasury for testing
  
  console.log("Deploying with account:", deployer.address);
  console.log("Treasury address:", treasury);
  
  // Deploy the contract
  console.log("📝 Deploying TimeCapsule...");
  const timeCapsule = await TimeCapsule.deploy(treasury);
  
  // Wait for deployment to be mined
  await timeCapsule.waitForDeployment();
  
  const contractAddress = await timeCapsule.getAddress();
  console.log("✅ TimeCapsule deployed to:", contractAddress);
  
  // Read contract data
  const protocolFee = await timeCapsule.protocolFee();
  const contractTreasury = await timeCapsule.treasury();
  const totalCapsules = await timeCapsule.totalCapsules();
  
  console.log("\n📊 Contract Details:");
  console.log("- Protocol fee:", ethers.formatEther(protocolFee), "ETH");
  console.log("- Treasury:", contractTreasury);
  console.log("- Total capsules:", totalCapsules.toString());
  
  // Save deployment info for frontend
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "hardhat",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    treasury: treasury
  };
  
  console.log("\n📄 Copy this for your frontend:");
  console.log("CONTRACT_ADDRESS =", contractAddress);
  
  return {
    timeCapsule,
    address: contractAddress,
    deployer: deployer.address
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });