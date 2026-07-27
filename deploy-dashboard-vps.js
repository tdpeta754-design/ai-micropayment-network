const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

const HOST = "43.98.195.107";
const USER = "root";
const PASS = "Huong9865";

async function main() {
  console.log("====================================================================");
  console.log("🚀 UPGRADING DASHBOARD ON ALIBABA CLOUD VPS (100% ENGLISH VIP)");
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

    console.log("\n🏗️ Building Next.js Dashboard production bundle on VPS...");
    const build = await ssh.execCommand("cd /root/ai-micropayment-network/dashboard && npm run build");
    console.log(build.stdout || build.stderr);

    console.log("\n🔄 Restarting Dashboard in PM2...");
    const pm2 = await ssh.execCommand("pm2 restart aimpn-dashboard");
    console.log(pm2.stdout || pm2.stderr);

    console.log("\n====================================================================");
    console.log("✨ 100% ENGLISH EXECUTIVE DASHBOARD IS LIVE AT http://43.98.195.107:3000 ✨");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
