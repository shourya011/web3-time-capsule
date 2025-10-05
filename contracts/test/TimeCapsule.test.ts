import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther, keccak256, toBytes } from "viem";

describe("TimeCapsule", function () {
  let timeCapsule: any;
  let owner: any;
  let user1: any;
  let treasury: any;

  beforeEach(async function () {
    // Get test accounts
    const [ownerAccount, user1Account, treasuryAccount] = await hre.viem.getWalletClients();
    owner = ownerAccount;
    user1 = user1Account;
    treasury = treasuryAccount;

    // Deploy TimeCapsule contract
    timeCapsule = await hre.viem.deployContract("TimeCapsule", [treasury.account.address]);
  });

  describe("Deployment", function () {
    it("Should set the correct treasury address", async function () {
      const contractTreasury = await timeCapsule.read.treasury();
      expect(contractTreasury.toLowerCase()).to.equal(treasury.account.address.toLowerCase());
    });

    it("Should set the correct protocol fee", async function () {
      const fee = await timeCapsule.read.protocolFee();
      expect(fee).to.equal(parseEther("0.001"));
    });

    it("Should initialize with zero capsules", async function () {
      const totalCapsules = await timeCapsule.read.totalCapsules();
      expect(totalCapsules).to.equal(0n);
    });
  });

  describe("Capsule Creation", function () {
    const contentText = "This is a secret message for the future!";
    const contentHash = keccak256(toBytes(contentText));
    const unlockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    
    it("Should create a capsule successfully", async function () {
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0, // RAW_TEXT
        contentHash,
        "QmTest123", // IPFS CID
        unlockTime,
        [], // no recipients
        true, // public
      ], { 
        value: fee, 
        account: user1.account 
      });

      // Wait for transaction
      await hre.viem.getPublicClient().waitForTransactionReceipt({ hash });

      const totalCapsules = await timeCapsule.read.totalCapsules();
      expect(totalCapsules).to.equal(1n);
    });

    it("Should add capsule to user's list", async function () {
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0,
        contentHash,
        "QmTest123",
        unlockTime,
        [],
        true,
      ], { 
        value: fee, 
        account: user1.account 
      });

      await hre.viem.getPublicClient().waitForTransactionReceipt({ hash });

      const userCapsules = await timeCapsule.read.getUserCapsules([user1.account.address]);
      expect(userCapsules).to.have.lengthOf(1);
      expect(userCapsules[0]).to.equal(1n);
    });
  });

  describe("Capsule Access", function () {
    let capsuleId: bigint;
    const contentText = "Secret content";
    const contentHash = keccak256(toBytes(contentText));
    const unlockTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      const fee = await timeCapsule.read.protocolFee();
      
      const hash = await timeCapsule.write.createCapsule([
        0, // RAW_TEXT
        contentHash,
        "QmTest123",
        unlockTime,
        [], // no recipients for now
        true, // public
      ], { 
        value: fee, 
        account: user1.account 
      });
      
      await hre.viem.getPublicClient().waitForTransactionReceipt({ hash });
      capsuleId = 1n;
    });

    it("Should allow owner to access capsule", async function () {
      const canAccess = await timeCapsule.read.canAccessCapsule([capsuleId, user1.account.address]);
      expect(canAccess).to.be.true;
    });

    it("Should get capsule metadata", async function () {
      const capsule = await timeCapsule.read.getCapsule([capsuleId]);
      
      expect(capsule.owner.toLowerCase()).to.equal(user1.account.address.toLowerCase());
      expect(capsule.contentHash).to.equal(contentHash);
      expect(capsule.capsuleType).to.equal(0); // RAW_TEXT
      expect(capsule.status).to.equal(0); // LOCKED
    });
  });
});