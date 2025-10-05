import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for TimeCapsule contract
 * 
 * This module deploys the TimeCapsule contract with a treasury address.
 * The treasury address receives protocol fees from capsule creation.
 */
const TimeCapsuleModule = buildModule("TimeCapsuleModule", (m) => {
  // Parameters
  const treasury = m.getParameter("treasury", "0x742d35Cc6639C10532BfeD48c4F4B8a2c857Fd3e"); // Default treasury address
  
  // Deploy TimeCapsule contract
  const timeCapsule = m.contract("TimeCapsule", [treasury], {
    id: "TimeCapsule",
  });

  // Return the contract instance
  return { timeCapsule };
});

export default TimeCapsuleModule;