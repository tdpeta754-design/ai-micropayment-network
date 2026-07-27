const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function main() {
  console.log("====================================================================");
  console.log("🛠️ AIMPN V2.0 — INSTALLING DEMO PROVIDER DEPENDENCIES ON VPS");
  console.log("====================================================================");
  
  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n📦 Installing demo packages (express, cors, @antigravity/sdk)...");
    const result = await ssh.execCommand("cd /root/ai-micropayment-network/demo && npm install && npm link ../sdk && pm2 restart aimpn-provider && pm2 status");
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    console.log("\n====================================================================");
    console.log("✨ ALL 3 SERVICES (BACKEND, PROVIDER, DASHBOARD) ARE NOW ONLINE! ✨");
    console.log("👉 Dashboard UI : http://43.98.195.107:3000");
    console.log("👉 Backend API  : http://43.98.195.107:3001/api/health");
    console.log("👉 Provider Gate: http://43.98.195.107:3002/api/market-intelligence");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
