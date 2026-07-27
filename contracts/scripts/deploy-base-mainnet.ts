import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * AI Micropayment Network (AiMPN v2.0)
 * OFFICIAL BASE MAINNET DEPLOYMENT SCRIPT
 * 
 * Target Network: Base Mainnet (Chain ID: 8453)
 * Strategy: Zero Human Intervention / Solo Founder AI-Native Architecture
 */

// Production Contract Addresses on Base Mainnet
const BASE_MAINNET_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ENTRY_POINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const CHAINLINK_ETH_USD_ORACLE = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70";

async function main() {
  console.log("====================================================================");
  console.log("🚀 AiMPN v2.0 — BASE MAINNET PRODUCTION DEPLOYMENT SEQUENCE");
  console.log("====================================================================");
  console.log(`Network Name      : ${network.name}`);
  console.log(`Chain ID          : ${network.config.chainId || "Auto-detected"}`);
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balanceWei = await ethers.provider.getBalance(deployerAddress);
  const balanceEth = ethers.formatEther(balanceWei);

  console.log(`Deployer Account  : ${deployerAddress}`);
  console.log(`Deployer Balance  : ${balanceEth} ETH`);

  // Safety threshold check (require at least 0.005 ETH for gas)
  if (parseFloat(balanceEth) < 0.005 && network.name !== "hardhat" && network.name !== "localhost") {
    console.warn("⚠️ [WARNING] Deployer ETH balance is very low (< 0.005 ETH). Deployment may fail out of gas!");
  }

  // Determine which USDC to use (if testing locally/simulation, deploy mock if needed, otherwise use real mainnet USDC)
  let usdcAddress = BASE_MAINNET_USDC;
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\n🧪 [Simulation Mode Detected] Using simulated USDC address or deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`   └─ MockUSDC Deployed at: ${usdcAddress}`);
  } else {
    console.log(`\n💎 Using Official Base Mainnet USDC: ${usdcAddress}`);
    console.log(`🔗 Using Chainlink ETH/USD Oracle   : ${CHAINLINK_ETH_USD_ORACLE}`);
  }

  // 1. Deploy WalletFactory
  let walletFactoryAddress = "0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6";
  if (network.name !== "base-mainnet") {
    console.log("\n📦 [1/3] Deploying WalletFactory (CREATE2 Counterfactual Registry)...");
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const walletFactory = await WalletFactory.deploy();
    await walletFactory.waitForDeployment();
    walletFactoryAddress = await walletFactory.getAddress();
  }
  console.log(`   └─ WalletFactory Deployed at : ${walletFactoryAddress}`);

  // 2. Deploy PaymentRouter
  const feeCollector = deployerAddress; // Initial fee collector is deployer warden
  let paymentRouterAddress = "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916";
  if (network.name !== "base-mainnet") {
    console.log("\n⚡ [2/3] Deploying PaymentRouter (M2M Escrow & Fee Engine)...");
    const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
    const paymentRouter = await PaymentRouter.deploy(usdcAddress, feeCollector);
    await paymentRouter.waitForDeployment();
    paymentRouterAddress = await paymentRouter.getAddress();
  }
  console.log(`   └─ PaymentRouter Deployed at : ${paymentRouterAddress}`);

  // 3. Deploy Paymaster
  console.log("\n⛽ [3/3] Deploying Paymaster (Gasless ETH Sponsorship & USDC Settlement)...");
  const initialEthUsdcRate = 3500_000000n; // $3500.00 / ETH (6 decimals)
  const Paymaster = await ethers.getContractFactory("Paymaster");
  const paymaster = await Paymaster.deploy(ENTRY_POINT_V06, usdcAddress, initialEthUsdcRate);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log(`   └─ Paymaster Deployed at     : ${paymasterAddress}`);

  // 4. Deposit ETH into EntryPoint for Paymaster sponsorship
  if (network.name === "base-mainnet" && parseFloat(balanceEth) > 0.05) {
    console.log("\n⛽ [4/4] Funding Paymaster Gas Pool in ERC-4337 EntryPoint (0.05 ETH)...");
    const depositTx = await paymaster.deposit({ value: ethers.parseEther("0.05") });
    await depositTx.wait();
    console.log("   └─ Paymaster Funded with 0.05 ETH for Free Gas Sponsorship!");
  }

  // Save deployment artifact
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId || 8453,
    deployer: deployerAddress,
    contracts: {
      usdc: usdcAddress,
      entryPoint: ENTRY_POINT_V06,
      chainlinkOracle: CHAINLINK_ETH_USD_ORACLE,
      walletFactory: walletFactoryAddress,
      paymentRouter: paymentRouterAddress,
      paymaster: paymasterAddress
    },
    config: {
      initialEthUsdcRate: initialEthUsdcRate.toString(),
      feeCollector: feeCollector
    },
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = network.name === "hardhat" || network.name === "localhost" 
    ? "base-mainnet-simulation.json" 
    : "base-mainnet.json";
  const outputPath = path.join(deploymentsDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Deployment summary saved to: deployments/${filename}`);

  console.log("\n====================================================================");
  console.log("🛡️ VERIFICATION COMMANDS (Basescan / Etherscan)");
  console.log("====================================================================");
  console.log(`npx hardhat verify --network base-mainnet ${walletFactoryAddress}`);
  console.log(`npx hardhat verify --network base-mainnet ${paymentRouterAddress} "${usdcAddress}" "${feeCollector}"`);
  console.log(`npx hardhat verify --network base-mainnet ${paymasterAddress} "${ENTRY_POINT_V06}" "${usdcAddress}" "${initialEthUsdcRate}"`);
  console.log("====================================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal Deployment Error:", error);
    process.exit(1);
  });
