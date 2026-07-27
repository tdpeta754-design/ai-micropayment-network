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

// Load env from contracts/.env or backend/.env
let dotenv;
try {
  dotenv = require("./contracts/node_modules/dotenv");
} catch (e) {
  dotenv = require("dotenv");
}
if (fs.existsSync(path.join(__dirname, "contracts", ".env"))) {
  dotenv.config({ path: path.join(__dirname, "contracts", ".env") });
} else {
  dotenv.config({ path: path.join(__dirname, "backend", ".env") });
}

// Configuration
const RPC_URL = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const ROUTER_ADDRESS = "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BOUNTY_REWARD_USDC = 10_000000n; // 10 USDC (6 decimals)
const MAX_BOUNTIES = 5; // First 5 developers
const TX_THRESHOLD = 100; // 100 transactions to qualify

const DB_PATH = path.join(__dirname, "bounty_database.json");

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  }
  return {
    totalBountiesPaid: 0,
    wallets: {}, // address -> { txCount, paid, qualifiedAt, txHash }
    lastBlockIndexed: 0
  };
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function startEngine() {
  console.log("====================================================================");
  console.log("🤖 AIMPN V2.0 — ON-CHAIN BOUNTY INDEXER & PAYOUT ENGINE");
  console.log("====================================================================");
  console.log(`🌐 Network      : Base Mainnet (Chain ID: 8453)`);
  console.log(`⚡ Router       : ${ROUTER_ADDRESS}`);
  console.log(`🎁 Reward Pool  : ${MAX_BOUNTIES} x 10 USDC (${MAX_BOUNTIES * 10} USDC total)`);
  console.log(`📈 Threshold    : ${TX_THRESHOLD} txns per developer wallet`);
  console.log("====================================================================\n");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Optional wallet for automated payouts if PRIVATE_KEY is provided and funded
  let treasuryWallet = null;
  if (process.env.PRIVATE_KEY) {
    treasuryWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`👑 Treasury Account : ${treasuryWallet.address}`);
  }

  const routerAbi = [
    "event PaymentProcessed(address indexed from, address indexed to, uint256 amount, bytes32 nonce, string purpose, uint256 fee)"
  ];
  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);

  const usdcAbi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  let usdc = null;
  if (treasuryWallet) {
    usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, treasuryWallet);
  }

  const db = loadDB();
  console.log(`📁 Database Loaded. Total Bounties Paid: ${db.totalBountiesPaid} / ${MAX_BOUNTIES}`);

  let lastBlock = await provider.getBlockNumber();
  db.lastBlockIndexed = db.lastBlockIndexed || lastBlock;
  console.log(`\n🎧 Polling real-time PaymentProcessed events starting from block ${db.lastBlockIndexed}...`);

  async function pollLogs() {
    try {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock > db.lastBlockIndexed) {
        const fromBlock = db.lastBlockIndexed + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 500); // 500 block max chunk
        
        const filter = router.filters.PaymentProcessed();
        const logs = await router.queryFilter(filter, fromBlock, toBlock);
        
        for (const log of logs) {
          const { from, to, amount, nonce, purpose, fee } = log.args;
          console.log(`\n⚡ [NEW ON-CHAIN PAYMENT] From: ${from} -> To: ${to} | Purpose: "${purpose}"`);
          
          if (!db.wallets[from]) {
            db.wallets[from] = { txCount: 0, paid: false, firstSeen: new Date().toISOString() };
          }
          
          db.wallets[from].txCount += 1;
          const count = db.wallets[from].txCount;
          console.log(`   └─ Wallet ${from} Transaction Count: ${count} / ${TX_THRESHOLD}`);

          if (count >= TX_THRESHOLD && !db.wallets[from].paid) {
            console.log(`\n🎉 [BOUNTY QUALIFIED!] Wallet ${from} has reached ${count} transactions!`);
            
            if (db.totalBountiesPaid < MAX_BOUNTIES) {
              db.wallets[from].qualifiedAt = new Date().toISOString();
              
              if (treasuryWallet && usdc) {
                try {
                  const balance = await usdc.balanceOf(treasuryWallet.address);
                  if (balance >= BOUNTY_REWARD_USDC) {
                    console.log(`💸 Executing instant 10 USDC payout on Base Mainnet...`);
                    const tx = await usdc.transfer(from, BOUNTY_REWARD_USDC);
                    console.log(`   └─ Payout Tx Hash: https://basescan.org/tx/${tx.hash}`);
                    await tx.wait();
                    db.wallets[from].paid = true;
                    db.wallets[from].payoutTxHash = tx.hash;
                    db.totalBountiesPaid += 1;
                    console.log(`✅ BOUNTY PAID! Developer ${from} received 10 USDC!`);
                  } else {
                    console.warn(`⚠️ Treasury USDC balance (${ethers.formatUnits(balance, 6)} USDC) is insufficient for instant payout. Marked for manual settlement.`);
                  }
                } catch (err) {
                  console.error(`❌ Payout Tx failed:`, err.message);
                }
              } else {
                console.log(`👑 Qualified! Marked in database for Chairman review & payout.`);
              }
            } else {
              console.log(`ℹ️ Bounty pool limit (${MAX_BOUNTIES}) reached. Dev completed threshold!`);
            }
          }
        }
        
        db.lastBlockIndexed = toBlock;
        saveDB(db);
      }
    } catch (err) {
      if (err.message && !err.message.includes('rate limit') && !err.message.includes('timeout') && !err.message.includes('network')) {
        console.warn('⚠️ [RPC Polling Notice]:', err.message);
      }
    }
  }

  // Poll every 10 seconds
  setInterval(pollLogs, 10000);
}

startEngine().catch(console.error);
