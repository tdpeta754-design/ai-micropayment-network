const fs = require("fs");
const path = require("path");

// Try loading ethers from contracts or backend node_modules
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

async function main() {
  console.log("====================================================================");
  console.log("👑 AIMPN V2.0 — GENERATING BRAND NEW MAINNET MASTER WALLET");
  console.log("====================================================================");

  // Generate cryptographically random wallet
  const wallet = ethers.Wallet.createRandom();

  const publicAddress = wallet.address;
  const privateKey = wallet.privateKey;
  const mnemonic = wallet.mnemonic ? wallet.mnemonic.phrase : "N/A";

  console.log("\n✅ NEW MASTER WALLET GENERATED SUCCESSFULLY!");
  console.log("--------------------------------------------------------------------");
  console.log("👉 PUBLIC ADDRESS (Ví nhận ETH Base Mainnet) : " + publicAddress);
  console.log("👉 PRIVATE KEY  (Khóa riêng tư tuyệt mật)    : " + privateKey);
  if (mnemonic !== "N/A") {
    console.log("👉 MNEMONIC     (12 từ khóa khôi phục)       : " + mnemonic);
  }
  console.log("--------------------------------------------------------------------");

  // Save backup file
  const backupData = {
    project: "AI Micropayment Network (AiMPN v2.0)",
    role: "Mainnet Master Deployer & Protocol Owner Wallet",
    network: "Base Mainnet (Chain ID: 8453)",
    createdAt: new Date().toISOString(),
    publicAddress: publicAddress,
    privateKey: privateKey,
    mnemonic: mnemonic,
    securityNote: "KEEP THIS FILE SAFE AND NEVER SHARE YOUR PRIVATE KEY WITH ANYONE EXCEPT YOUR AI COO."
  };

  const backupPath = path.join(__dirname, "AIMPN_MAINNET_MASTER_WALLET_BACKUP.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log("\n🔒 Secure backup saved to: " + backupPath);

  // Update contracts/.env
  const envPath = path.join(__dirname, "contracts", ".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("PRIVATE_KEY=")) {
      envContent = envContent.replace(/PRIVATE_KEY=.*/g, `PRIVATE_KEY=${privateKey}`);
    } else {
      envContent += `\nPRIVATE_KEY=${privateKey}\n`;
    }
  } else {
    envContent = `# AI Micropayment Network - Environment Config\nPRIVATE_KEY=${privateKey}\nBASE_SEPOLIA_RPC_URL=https://sepolia.base.org\nBASE_MAINNET_RPC_URL=https://mainnet.base.org\n`;
  }
  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("✅ Successfully updated PRIVATE_KEY in contracts/.env!");

  console.log("\n====================================================================");
  console.log("🚨 INSTRUCTION FOR CHAIRMAN: DEPOSIT 0.06 ETH (Base Mainnet) TO:");
  console.log("👉 " + publicAddress);
  console.log("====================================================================\n");
}

main().catch(console.error);
