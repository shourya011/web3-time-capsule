import { expect } from "chai";
import hre from "hardhat";
import { parseEther, keccak256, toBytes } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("TimeCapsule", function () {
  async function deployTimeCapsuleFixture() {
    // Get test accounts
    const [owner, user1, treasury] = await hre.viem.getWalletClients();

    // Deploy TimeCapsule contract
    const timeCapsule = await hre.viem.deployContract("TimeCapsule", [treasury.account.address]);

    return {
      timeCapsule,
      owner,
      user1,
      treasury,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct treasury address", async function () {
      const { timeCapsule, treasury } = await loadFixture(deployTimeCapsuleFixture);
      
      const contractTreasury = await timeCapsule.read.treasury();
      expect(contractTreasury.toLowerCase()).to.equal(treasury.account.address.toLowerCase());
    });

    it("Should set the correct protocol fee", async function () {
      const { timeCapsule } = await loadFixture(deployTimeCapsuleFixture);
      
      const fee = await timeCapsule.read.protocolFee();
      expect(fee).to.equal(parseEther("0.001"));
    });

    it("Should initialize with zero capsules", async function () {
      const { timeCapsule } = await loadFixture(deployTimeCapsuleFixture);
      
      const totalCapsules = await timeCapsule.read.totalCapsules();
      expect(totalCapsules).to.equal(0n);
    });
  });

  describe("Capsule Creation", function () {
    it("Should create a capsule successfully", async function () {
      const { timeCapsule, owner } = await loadFixture(deployTimeCapsuleFixture);
      
      const contentText = "This is a secret message for the future!";
      const contentHash = keccak256(toBytes(contentText));
      const unlockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0, // RAW_TEXT
        contentHash,
        "QmTest123", // IPFS CID
        BigInt(unlockTime),
        [], // No recipients
        true // Public capsule
      ], { 
        value: fee,
        account: owner.account
      });

      // Wait for transaction
      const publicClient = await hre.viem.getPublicClient();
      await publicClient.waitForTransactionReceipt({ hash });

      // Check total capsules increased
      const totalCapsules = await timeCapsule.read.totalCapsules();
      expect(totalCapsules).to.equal(1n);
    });

    it("Should add capsule to user's list", async function () {
      const { timeCapsule, owner } = await loadFixture(deployTimeCapsuleFixture);
      
      const contentText = "Another secret message!";
      const contentHash = keccak256(toBytes(contentText));
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0, // RAW_TEXT
        contentHash,
        "QmTest456",
        BigInt(unlockTime),
        [],
        true
      ], { 
        value: fee,
        account: owner.account
      });

      const publicClient = await hre.viem.getPublicClient();
      await publicClient.waitForTransactionReceipt({ hash });

      // Check user's capsules
      const userCapsules = await timeCapsule.read.getUserCapsules([owner.account.address]);
      expect(userCapsules.length).to.equal(1);
      expect(userCapsules[0]).to.equal(1n);
    });
  });

  describe("Capsule Access", function () {
    it("Should allow owner to access their capsule", async function () {
      const { timeCapsule, owner } = await loadFixture(deployTimeCapsuleFixture);
      
      // Create a capsule first
      const contentText = "Access test message";
      const contentHash = keccak256(toBytes(contentText));
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0,
        contentHash,
        "QmAccessTest",
        BigInt(unlockTime),
        [],
        true
      ], { 
        value: fee,
        account: owner.account
      });

      const publicClient = await hre.viem.getPublicClient();
      await publicClient.waitForTransactionReceipt({ hash });

      // Check access
      const canAccess = await timeCapsule.read.canAccessCapsule([1n, owner.account.address]);
      expect(canAccess).to.be.true;
    });

    it("Should get capsule metadata", async function () {
      const { timeCapsule, owner } = await loadFixture(deployTimeCapsuleFixture);
      
      const contentText = "Metadata test";
      const contentHash = keccak256(toBytes(contentText));
      const unlockTime = Math.floor(Date.now() / 1000) + 86400;
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0,
        contentHash,
        "QmMetadataTest",
        BigInt(unlockTime),
        [],
        true
      ], { 
        value: fee,
        account: owner.account
      });

      const publicClient = await hre.viem.getPublicClient();
      await publicClient.waitForTransactionReceipt({ hash });

      // Get capsule metadata
      const capsule = await timeCapsule.read.getCapsule([1n]);
      expect(capsule[0].toLowerCase()).to.equal(owner.account.address.toLowerCase()); // owner
      expect(capsule[3]).to.equal(0); // capsuleType (RAW_TEXT)
      expect(capsule[4]).to.equal(0); // status (LOCKED)
      expect(capsule[6]).to.equal("QmMetadataTest"); // contentRef
    });
  });
});