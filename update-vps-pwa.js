const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function main() {
  console.log("====================================================================");
  console.log("📱 AIMPN V2.0 — DEPLOYING PWA MOBILE EXECUTIVE APP TO VPS");
  console.log("====================================================================");
  
  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n📥 Pulling latest Git commit (PWA Manifest & Mobile Executive Cards)...");
    await ssh.execCommand("cd /root/ai-micropayment-network && git pull origin main");

    console.log("\n🏗️ Rebuilding Next.js 15 Production Bundle with PWA capabilities...");
    const build = await ssh.execCommand("cd /root/ai-micropayment-network/dashboard && npm run build");
    console.log(build.stdout || build.stderr);

    console.log("\n🔄 Restarting aimpn-dashboard in PM2...");
    const pm2 = await ssh.execCommand("pm2 restart aimpn-dashboard && pm2 status");
    console.log(pm2.stdout);

    console.log("\n====================================================================");
    console.log("✨ MOBILE EXECUTIVE PWA APP DEPLOYED TO VPS SUCCESSFULLY! ✨");
    console.log("👉 Open on your iPhone / Android : http://43.98.195.107:3000");
    console.log("👉 Tap 'Add to Home Screen' to install as native standalone app!");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
