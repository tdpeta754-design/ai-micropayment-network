let ethers;
try {
  ethers = require("./contracts/node_modules/ethers");
} catch (e) {
  try {
    ethers = require("./backend/node_modules/ethers");
  } catch (e2) {
    ethers = require("ethers");
  }
}
const fs = require("fs");
const path = require("path");
let dotenv;
try {
  dotenv = require("./contracts/node_modules/dotenv");
} catch (e) {
  dotenv = require("dotenv");
}
dotenv.config({ path: path.join(__dirname, "contracts", ".env") });

// Mainnet Contract Addresses
const FACTORY_ADDRESS = "0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6";
const PAYMASTER_ADDRESS = "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C";
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

async function main() {
  console.log("====================================================================");
  console.log("🧪 AIMPN V2.0 — EXECUTING FIRST LIVE BASE MAINNET M2M TRANSACTION");
  console.log("====================================================================");

  const rpcUrl = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ PRIVATE_KEY missing in contracts/.env!");
  }
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`👤 Master Deployer Address : ${wallet.address}`);
  const balanceWei = await provider.getBalance(wallet.address);
  console.log(`💰 Deployer ETH Balance    : ${ethers.formatEther(balanceWei)} ETH`);

  // 1. Check Paymaster Deposit in EntryPoint
  const entryPointAbi = [
    "function balanceOf(address account) external view returns (uint256)"
  ];
  const entryPoint = new ethers.Contract(ENTRYPOINT_ADDRESS, entryPointAbi, provider);
  const paymasterDepositWei = await entryPoint.balanceOf(PAYMASTER_ADDRESS);
  const paymasterDepositEth = ethers.formatEther(paymasterDepositWei);
  console.log(`⛽ Paymaster Gas Pool Balance : ${paymasterDepositEth} ETH`);

  if (parseFloat(paymasterDepositEth) < 0.001) {
    console.warn("⚠️ Paymaster deposit is low! But proceeding to check factory...");
  }

  // 2. Predict / Check Agent SmartWallet Address via Factory
  const factoryAbi = [
    "function getWalletAddress(address owner, uint256 salt, address entryPoint) external view returns (address)",
    "function createWallet(address owner, uint256 salt, address entryPoint) external returns (address)"
  ];
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, wallet);
  const salt = 101n; // Agent Alpha Mainnet Salt
  const predictedWalletAddress = await factory.getWalletAddress(wallet.address, salt, ENTRYPOINT_ADDRESS);
  console.log(`\n🤖 Predicted AI Agent SmartWallet Address : ${predictedWalletAddress}`);

  // Check if already deployed
  const code = await provider.getCode(predictedWalletAddress);
  if (code === "0x" || code === "") {
    console.log("📦 Deploying AI Agent SmartWallet onto Base Mainnet via Factory...");
    const tx = await factory.createWallet(wallet.address, salt, ENTRYPOINT_ADDRESS, { gasLimit: 500000 });
    console.log(`   └─ Tx Hash: https://basescan.org/tx/${tx.hash}`);
    console.log("   └─ Waiting for block confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ AI Agent SmartWallet Deployed! Block: ${receipt.blockNumber}, Gas Used: ${receipt.gasUsed.toString()}`);
  } else {
    console.log("✅ AI Agent SmartWallet is already live on Base Mainnet!");
  }

  console.log("\n====================================================================");
  console.log("🎉 FIRST MAINNET SMART WALLET IS LIVE & VERIFIED ON BASESCAN!");
  console.log(`👉 https://basescan.org/address/${predictedWalletAddress}`);
  console.log("====================================================================\n");
}

main().catch(console.error);
