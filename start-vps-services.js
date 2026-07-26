const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

const HOST = "43.98.195.107";
const USER = "root";
const PASS = "Huong9865";

async function main() {
  console.log("====================================================================");
  console.log("🚀 AIMPN V2.0 — STARTING PM2 PRODUCTION SERVICES ON VPS");
  console.log("====================================================================");
  
  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n⚡ Starting PM2 Ecosystem services...");
    const result = await ssh.execCommand("cd /root/ai-micropayment-network && pm2 start ecosystem.config.js && pm2 save && pm2 status");
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    // Open firewall ports 3000 and 3001
    await ssh.execCommand("ufw allow 3000/tcp && ufw allow 3001/tcp && ufw allow 80/tcp && ufw allow 443/tcp || true");
    console.log("\n✅ Firewall ports 3000, 3001, 80, 443 opened!");

    console.log("\n====================================================================");
    console.log("✨ SERVICES ARE NOW LIVE ONLINE! ✨");
    console.log("👉 Dashboard UI : http://43.98.195.107:3000");
    console.log("👉 Backend API  : http://43.98.195.107:3001");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error starting PM2 services:", err);
  } finally {
    ssh.dispose();
  }
}

main();
