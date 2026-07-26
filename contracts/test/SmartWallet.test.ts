import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SmartWallet", function () {
  const USDC_DECIMALS = 6;
  const parseUSDC = (amount: string) => ethers.parseUnits(amount, USDC_DECIMALS);

  // Use a fake EntryPoint address for testing (we won't call via EP in unit tests)
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  async function deployWalletFixture() {
    const [owner, otherAccount, sessionKeySigner, addr3, addr4] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();

    // Deploy WalletFactory
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const factory = await WalletFactory.deploy();
    await factory.waitForDeployment();

    // Create a wallet via factory (3 args: owner, salt, entryPoint)
    const salt = 1;
    const tx = await factory.createWallet(owner.address, salt, ENTRY_POINT);
    await tx.wait();

    // Get deployed wallet address
    const walletAddress = await factory.getWalletAddress(owner.address, salt, ENTRY_POINT);

    // Attach the SmartWallet interface
    const SmartWallet = await ethers.getContractFactory("SmartWallet");
    const wallet = SmartWallet.attach(walletAddress) as any;

    // Fund the wallet with ETH for testing
    await owner.sendTransaction({
      to: walletAddress,
      value: ethers.parseEther("10.0"),
    });

    // Mint USDC to the wallet
    await mockUSDC.mint(walletAddress, parseUSDC("10000"));

    return { wallet, factory, mockUSDC, owner, otherAccount, sessionKeySigner, addr3, addr4, walletAddress, salt, usdcAddress };
  }

  // ==============================
  // 1. Deployment
  // ==============================
  describe("1. Deployment", function () {
    it("WalletFactory deploys correctly", async function () {
      const { factory } = await loadFixture(deployWalletFixture);
      expect(await factory.getAddress()).to.be.properAddress;
    });

    it("SmartWallet is created via factory with correct owner", async function () {
      const { wallet, owner } = await loadFixture(deployWalletFixture);
      expect(await wallet.owner()).to.equal(owner.address);
    });

    it("Counterfactual address matches actual deployment", async function () {
      const { factory, owner, walletAddress, salt } = await loadFixture(deployWalletFixture);
      const predictedAddress = await factory.getWalletAddress(owner.address, salt, ENTRY_POINT);
      expect(predictedAddress).to.equal(walletAddress);
    });

    it("Total wallets counter increments", async function () {
      const { factory } = await loadFixture(deployWalletFixture);
      expect(await factory.totalWallets()).to.equal(1);
    });
  });

  // ==============================
  // 2. Execution
  // ==============================
  describe("2. Execution", function () {
    it("Owner can execute ETH transfer", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);
      const amount = ethers.parseEther("0.1");
      const initialBalance = await ethers.provider.getBalance(otherAccount.address);

      await wallet.connect(owner).execute(otherAccount.address, amount, "0x");

      const finalBalance = await ethers.provider.getBalance(otherAccount.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Owner can execute ERC20 transfer (MockUSDC)", async function () {
      const { wallet, owner, otherAccount, mockUSDC, usdcAddress } = await loadFixture(deployWalletFixture);
      const amount = parseUSDC("100");

      const transferData = mockUSDC.interface.encodeFunctionData("transfer", [otherAccount.address, amount]);
      await wallet.connect(owner).execute(usdcAddress, 0, transferData);

      expect(await mockUSDC.balanceOf(otherAccount.address)).to.equal(amount);
    });

    it("Non-owner cannot execute (should revert)", async function () {
      const { wallet, otherAccount } = await loadFixture(deployWalletFixture);

      await expect(
        wallet.connect(otherAccount).execute(otherAccount.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWithCustomError(wallet, "NotEntryPointOrOwner");
    });

    it("Batch execution works", async function () {
      const { wallet, owner, otherAccount, mockUSDC, usdcAddress } = await loadFixture(deployWalletFixture);

      const ethAmount = ethers.parseEther("0.1");
      const usdcAmount = parseUSDC("100");

      const targets = [otherAccount.address, usdcAddress];
      const values = [ethAmount, 0n];
      const transferData = mockUSDC.interface.encodeFunctionData("transfer", [otherAccount.address, usdcAmount]);
      const calldatas = ["0x", transferData];

      const initialEth = await ethers.provider.getBalance(otherAccount.address);

      await wallet.connect(owner).executeBatch(targets, values, calldatas);

      const finalEth = await ethers.provider.getBalance(otherAccount.address);
      expect(finalEth - initialEth).to.equal(ethAmount);
      expect(await mockUSDC.balanceOf(otherAccount.address)).to.equal(usdcAmount);
    });
  });

  // ==============================
  // 3. Spending Limits
  // ==============================
  describe("3. Spending Limits", function () {
    it("Owner can set spending policy", async function () {
      const { wallet, owner } = await loadFixture(deployWalletFixture);

      // setSpendingPolicy(maxPerTx, dailyLimit, monthlyLimit, cooldownSeconds)
      await expect(
        wallet.connect(owner).setSpendingPolicy(
          ethers.parseEther("1"),   // max 1 ETH per tx
          ethers.parseEther("5"),   // 5 ETH daily
          ethers.parseEther("50"),  // 50 ETH monthly
          0                          // no cooldown
        )
      ).to.emit(wallet, "SpendingPolicyUpdated");
    });

    it("Transaction within per-tx limit succeeds", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);

      // Set limit: max 1 ETH per tx
      await wallet.connect(owner).setSpendingPolicy(
        ethers.parseEther("1"), ethers.parseEther("10"), ethers.parseEther("100"), 0
      );

      // Send 0.5 ETH — within limit
      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("0.5"), "0x")
      ).to.not.be.reverted;
    });

    it("Transaction exceeding per-tx limit reverts", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);

      // Set limit: max 1 ETH per tx
      await wallet.connect(owner).setSpendingPolicy(
        ethers.parseEther("1"), ethers.parseEther("10"), ethers.parseEther("100"), 0
      );

      // Send 2 ETH — exceeds limit
      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("2"), "0x")
      ).to.be.revertedWithCustomError(wallet, "ExceedsMaxPerTx");
    });

    it("Daily limit tracking (multiple txs accumulate)", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);

      // Set limit: max 5 ETH per tx, 2 ETH daily
      await wallet.connect(owner).setSpendingPolicy(
        ethers.parseEther("5"), ethers.parseEther("2"), ethers.parseEther("100"), 0
      );

      // First tx: 1.5 ETH — OK
      await wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("1.5"), "0x");

      // Second tx: 1 ETH — exceeds daily (1.5 + 1 = 2.5 > 2)
      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("1"), "0x")
      ).to.be.revertedWithCustomError(wallet, "ExceedsDailyLimit");
    });
  });

  // ==============================
  // 4. Session Keys
  // ==============================
  describe("4. Session Keys", function () {
    it("Owner can add session key", async function () {
      const { wallet, owner, sessionKeySigner } = await loadFixture(deployWalletFixture);
      const now = Math.floor(Date.now() / 1000);

      await expect(
        wallet.connect(owner).addSessionKey(
          sessionKeySigner.address,
          now,              // validAfter
          now + 86400,      // validUntil (24h)
          ethers.parseEther("1") // spendLimit
        )
      ).to.emit(wallet, "SessionKeyAdded");
    });

    it("Revoke session key works", async function () {
      const { wallet, owner, sessionKeySigner } = await loadFixture(deployWalletFixture);
      const now = Math.floor(Date.now() / 1000);

      await wallet.connect(owner).addSessionKey(sessionKeySigner.address, now, now + 86400, ethers.parseEther("1"));

      await expect(
        wallet.connect(owner).revokeSessionKey(sessionKeySigner.address)
      ).to.emit(wallet, "SessionKeyRevoked");

      // Verify it's inactive
      const key = await wallet.sessionKeys(sessionKeySigner.address);
      expect(key.active).to.equal(false);
    });
  });

  // ==============================
  // 5. Whitelist/Blacklist
  // ==============================
  describe("5. Whitelist/Blacklist", function () {
    it("Enable whitelist, add address, transfer succeeds", async function () {
      const { wallet, owner, addr3 } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner).setWhitelistEnabled(true);
      await wallet.connect(owner).setWhitelist(addr3.address, true);

      // Execute to whitelisted address — should succeed
      await expect(
        wallet.connect(owner).execute(addr3.address, ethers.parseEther("0.1"), "0x")
      ).to.not.be.reverted;
    });

    it("Non-whitelisted fails when whitelist is enabled", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner).setWhitelistEnabled(true);
      // otherAccount is NOT whitelisted

      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWithCustomError(wallet, "DestNotWhitelisted");
    });

    it("Blacklisted address always fails", async function () {
      const { wallet, owner, addr4 } = await loadFixture(deployWalletFixture);

      await wallet.connect(owner).setBlacklist(addr4.address, true);

      await expect(
        wallet.connect(owner).execute(addr4.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWithCustomError(wallet, "DestBlacklisted");
    });
  });

  // ==============================
  // 6. Pause
  // ==============================
  describe("6. Pause", function () {
    it("Owner can pause wallet", async function () {
      const { wallet, owner } = await loadFixture(deployWalletFixture);

      await expect(wallet.connect(owner).pause())
        .to.emit(wallet, "WalletPaused");
      expect(await wallet.paused()).to.equal(true);
    });

    it("Paused wallet rejects execute", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);
      await wallet.connect(owner).pause();

      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWithCustomError(wallet, "WalletIsPaused");
    });

    it("Unpause works", async function () {
      const { wallet, owner, otherAccount } = await loadFixture(deployWalletFixture);
      await wallet.connect(owner).pause();
      await wallet.connect(owner).unpause();

      await expect(
        wallet.connect(owner).execute(otherAccount.address, ethers.parseEther("0.1"), "0x")
      ).to.not.be.reverted;
    });
  });
});
