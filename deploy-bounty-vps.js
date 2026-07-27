const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function main() {
  console.log("====================================================================");
  console.log("🚀 DEPLOYING BOUNTY INDEXER ENGINE TO ALIBABA CLOUD VPS");
  console.log("====================================================================");

  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n📥 Pulling latest Git repo...");
    await ssh.execCommand("cd /root/ai-micropayment-network && git pull origin main");

    console.log("\n🔄 Starting/Restarting Bounty Engine in PM2...");
    const pm2 = await ssh.execCommand("cd /root/ai-micropayment-network && pm2 start bounty-engine.js --name aimpn-bounty-engine || pm2 restart aimpn-bounty-engine");
    console.log(pm2.stdout || pm2.stderr);

    console.log("\n📋 Current PM2 Status:");
    const status = await ssh.execCommand("pm2 status");
    console.log(status.stdout);

    console.log("\n====================================================================");
    console.log("✨ BOUNTY INDEXER IS ONLINE & LISTENING TO BASE MAINNET 24/7! ✨");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
