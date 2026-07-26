import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaymentRouter", function () {
  const USDC_DECIMALS = 6;
  const parseUSDC = (amount: string) => ethers.parseUnits(amount, USDC_DECIMALS);

  async function deployRouterFixture() {
    const [owner, agentA, agentB, feeRecipient] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();

    // Deploy PaymentRouter (2 args: usdc, feeCollector)
    const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
    const router = await PaymentRouter.deploy(usdcAddress, feeRecipient.address);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();

    // Mint and approve for Agent A
    await mockUSDC.mint(agentA.address, parseUSDC("10000"));
    await mockUSDC.connect(agentA).approve(routerAddress, ethers.MaxUint256);

    // Mint and approve for Agent B
    await mockUSDC.mint(agentB.address, parseUSDC("10000"));
    await mockUSDC.connect(agentB).approve(routerAddress, ethers.MaxUint256);

    return { router, mockUSDC, owner, agentA, agentB, feeRecipient, routerAddress, usdcAddress };
  }

  // ==============================
  // 1. Process Payment
  // ==============================
  describe("1. Process payment", function () {
    it("USDC transfers correctly from A to B", async function () {
      const { router, mockUSDC, agentA, agentB } = await loadFixture(deployRouterFixture);
      const amount = parseUSDC("50");
      const nonce = ethers.id("payment-1");

      const initialBalanceA = await mockUSDC.balanceOf(agentA.address);
      const initialBalanceB = await mockUSDC.balanceOf(agentB.address);

      // processPayment(from, to, amount, nonce, purpose)
      await expect(
        router.connect(agentA).processPayment(agentA.address, agentB.address, amount, nonce, "API call")
      ).to.emit(router, "PaymentProcessed");

      expect(await mockUSDC.balanceOf(agentA.address)).to.equal(initialBalanceA - amount);
      expect(await mockUSDC.balanceOf(agentB.address)).to.equal(initialBalanceB + amount);
    });
  });

  // ==============================
  // 2. Nonce Prevention
  // ==============================
  describe("2. Nonce prevents replay", function () {
    it("same nonce reverts", async function () {
      const { router, agentA, agentB } = await loadFixture(deployRouterFixture);
      const amount = parseUSDC("50");
      const nonce = ethers.id("payment-replay-1");

      await router.connect(agentA).processPayment(agentA.address, agentB.address, amount, nonce, "First call");

      await expect(
        router.connect(agentA).processPayment(agentA.address, agentB.address, amount, nonce, "Replay attempt")
      ).to.be.revertedWithCustomError(router, "NonceUsed");
    });
  });

  // ==============================
  // 3. Protocol Fee
  // ==============================
  describe("3. Protocol fee", function () {
    it("set fee, verify deduction", async function () {
      const { router, mockUSDC, owner, agentA, agentB, feeRecipient } = await loadFixture(deployRouterFixture);

      // Set fee to 100 bps (1%)
      await expect(router.connect(owner).setProtocolFee(100))
        .to.emit(router, "ProtocolFeeUpdated");

      const amount = parseUSDC("100");
      const fee = parseUSDC("1");
      const receiveAmount = amount - fee;

      const initialFeeRecipientBalance = await mockUSDC.balanceOf(feeRecipient.address);
      const initialBalanceB = await mockUSDC.balanceOf(agentB.address);

      await router.connect(agentA).processPayment(agentA.address, agentB.address, amount, ethers.id("fee-tx"), "Fee check");

      expect(await mockUSDC.balanceOf(feeRecipient.address)).to.equal(initialFeeRecipientBalance + fee);
      expect(await mockUSDC.balanceOf(agentB.address)).to.equal(initialBalanceB + receiveAmount);
    });
  });

  // ==============================
  // 4. Escrow: Create -> Release
  // ==============================
  describe("4. Escrow: Create -> Release", function () {
    it("create -> release -> check balances", async function () {
      const { router, mockUSDC, agentA, agentB } = await loadFixture(deployRouterFixture);
      const amount = parseUSDC("100");
      const nonce = ethers.id("escrow-1");
      const timeoutSeconds = 3600; // 1 hour

      // Create escrow
      const tx = await router.connect(agentA).processPaymentWithEscrow(
        agentA.address,
        agentB.address,
        amount,
        nonce,
        timeoutSeconds
      );
      await tx.wait();

      // Compute escrow ID
      // keccak256(abi.encodePacked(from, to, amount, nonce, timestamp))
      // Or we can just grab it from event or getEscrow
      const block = await ethers.provider.getBlock("latest");
      const escrowId = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [agentA.address, agentB.address, amount, nonce, block!.timestamp]
      );

      const initialBalanceB = await mockUSDC.balanceOf(agentB.address);

      await expect(router.connect(agentA).releaseEscrow(escrowId))
        .to.emit(router, "EscrowReleased");

      expect(await mockUSDC.balanceOf(agentB.address)).to.equal(initialBalanceB + amount);
    });
  });

  // ==============================
  // 5. Escrow: Create -> Refund
  // ==============================
  describe("5. Escrow: Create -> Refund", function () {
    it("create -> wait past deadline -> refund", async function () {
      const { router, mockUSDC, agentA, agentB } = await loadFixture(deployRouterFixture);
      const amount = parseUSDC("100");
      const nonce = ethers.id("escrow-refund-1");
      const timeoutSeconds = 10; // 10 seconds

      const initialBalanceA = await mockUSDC.balanceOf(agentA.address);

      const tx = await router.connect(agentA).processPaymentWithEscrow(
        agentA.address,
        agentB.address,
        amount,
        nonce,
        timeoutSeconds
      );
      await tx.wait();

      const block = await ethers.provider.getBlock("latest");
      const escrowId = ethers.solidityPackedKeccak256(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [agentA.address, agentB.address, amount, nonce, block!.timestamp]
      );

      // Fast-forward time past deadline
      await ethers.provider.send("evm_increaseTime", [20]);
      await ethers.provider.send("evm_mine", []);

      await expect(router.connect(agentA).refundEscrow(escrowId))
        .to.emit(router, "EscrowRefunded");

      expect(await mockUSDC.balanceOf(agentA.address)).to.equal(initialBalanceA);
    });
  });

  // ==============================
  // 6. Batch Payments
  // ==============================
  describe("6. Batch payments", function () {
    it("multiple payments in one call", async function () {
      const { router, mockUSDC, agentA, agentB, owner } = await loadFixture(deployRouterFixture);
      const amounts = [parseUSDC("50"), parseUSDC("30")];

      const initialBalanceB = await mockUSDC.balanceOf(agentB.address);
      const initialBalanceOwner = await mockUSDC.balanceOf(owner.address);

      const requests = [
        {
          from: agentA.address,
          to: agentB.address,
          amount: amounts[0],
          nonce: ethers.id("batch-1"),
          purpose: "Batch req 1"
        },
        {
          from: agentA.address,
          to: owner.address,
          amount: amounts[1],
          nonce: ethers.id("batch-2"),
          purpose: "Batch req 2"
        }
      ];

      await expect(router.connect(agentA).processPaymentBatch(requests))
        .to.emit(router, "PaymentProcessed");

      expect(await mockUSDC.balanceOf(agentB.address)).to.equal(initialBalanceB + amounts[0]);
      expect(await mockUSDC.balanceOf(owner.address)).to.equal(initialBalanceOwner + amounts[1]);
    });
  });

  // ==============================
  // 7. Admin Functions
  // ==============================
  describe("7. Admin Functions", function () {
    it("Only owner can set fees", async function () {
      const { router, agentA } = await loadFixture(deployRouterFixture);

      // OZ v4 Ownable throws "Ownable: caller is not the owner"
      await expect(
        router.connect(agentA).setProtocolFee(100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
