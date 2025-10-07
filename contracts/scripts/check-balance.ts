import hre from "hardhat";
import { formatEther } from "viem";

async function main() {
  const walletClient = await hre.viem.getWalletClient();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("🔑 Deployer address:", walletClient.account.address);
  
  const balance = await publicClient.getBalance({
    address: walletClient.account.address,
  });
  
  console.log("💰 Balance:", formatEther(balance), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});