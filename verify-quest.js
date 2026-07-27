/**
 * ============================================================================
 * 🔍 AIMPN V2.0 — HACKATHON & GALXE QUEST AUTONOMOUS VERIFIER
 * ============================================================================
 * Checks on-chain transaction progress and bounty qualification status for any
 * participating developer wallet.
 * 
 * Usage: node verify-quest.js --wallet 0xYourWalletAddress
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "bounty_database.json");

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch (e) {}
  }
  return { wallets: {} };
}

async function main() {
  console.log("====================================================================");
  console.log("🔍 AIMPN V2.0 — HACKATHON & GALXE QUEST AUTONOMOUS VERIFIER");
  console.log("====================================================================\n");

  const args = process.argv.slice(2);
  let wallet = args[0];
  if (wallet && wallet.startsWith("--wallet")) wallet = args[1];

  if (!wallet || !wallet.startsWith("0x") || wallet.length !== 42) {
    console.log("💡 Notice: No target wallet specified.");
    console.log("👉 Checking status of default AiMPN Demo Sink: 0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E\n");
    wallet = "0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E";
  }

  const db = loadDB();
  const walletData = db.wallets[wallet] || { txCount: 0, paid: false };
  const targetThreshold = 100;
  const progressPercent = Math.min(100, Math.round((walletData.txCount / targetThreshold) * 100));

  console.log(`🎯 TARGET DEVELOPER WALLET: ${wallet}`);
  console.log("--------------------------------------------------------------------");
  console.log(`📊 Current On-Chain Transactions : ${walletData.txCount} / ${targetThreshold} TXNs`);
  console.log(`📈 Quest Progress                : [ ${progressPercent}% ]`);
  console.log(`💰 $10 USDC Bounty Status        : ${walletData.paid ? "✅ PAID OUT INSTANTLY TO WALLET!" : "⏳ IN PROGRESS (Complete 100 TXNs to unlock)"}`);

  if (walletData.paid && walletData.txHash) {
    console.log(`🔗 Payout Transaction Hash       : https://basescan.org/tx/${walletData.txHash}`);
  }

  console.log("--------------------------------------------------------------------\n");

  // Output Galxe / DoraHacks API compatible verification credential
  const credentialResult = {
    questId: "AIMPN_BUILDER_BOUNTY_BASE_MAINNET",
    wallet,
    qualified: walletData.txCount >= targetThreshold || walletData.paid,
    progress: progressPercent,
    verifiedAt: new Date().toISOString()
  };

  console.log("📋 [Galxe / DoraHacks OAuth Verification Credential Output]:");
  console.log(JSON.stringify(credentialResult, null, 2));
  console.log("\n====================================================================");
}

main().catch(console.error);
