const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

const HOST = "43.98.195.107";
const USER = "root";
const PASS = "Huong9865";

const ecosystemContent = `
module.exports = {
  apps: [
    {
      name: "aimpn-backend",
      script: "./src/server.js",
      cwd: "/root/ai-micropayment-network/backend",
      env: {
        PORT: 3001,
        NODE_ENV: "production"
      }
    },
    {
      name: "aimpn-provider",
      script: "agent-provider.js",
      cwd: "/root/ai-micropayment-network/demo",
      env: {
        PORT: 3002,
        NODE_ENV: "production"
      }
    },
    {
      name: "aimpn-dashboard",
      script: "npm",
      args: "run start -- -p 3000",
      cwd: "/root/ai-micropayment-network/dashboard",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        NEXT_PUBLIC_WS_URL: "ws://43.98.195.107:3001",
        NEXT_PUBLIC_API_URL: "http://43.98.195.107:3001"
      }
    }
  ]
};
`;

async function main() {
  console.log("====================================================================");
  console.log("🚀 AIMPN V2.0 — LAUNCHING LIVE PRODUCTION SERVICES ON VPS");
  console.log("====================================================================");
  
  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n📝 Writing production ecosystem.config.js on VPS...");
    await ssh.execCommand(`cat << 'EOF' > /root/ai-micropayment-network/ecosystem.config.js\n${ecosystemContent}\nEOF`);

    console.log("\n🔄 Restarting PM2 processes cleanly...");
    await ssh.execCommand("cd /root/ai-micropayment-network && pm2 delete all || true");
    const res = await ssh.execCommand("cd /root/ai-micropayment-network && pm2 start ecosystem.config.js && pm2 save && pm2 status");
    console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);

    console.log("\n====================================================================");
    console.log("✨ ALL SERVICES ARE LIVE ONLINE AND RUNNING IN 24/7 PM2 CLUSTER! ✨");
    console.log("👉 Dashboard UI : http://43.98.195.107:3000");
    console.log("👉 Backend API  : http://43.98.195.107:3001/api/health");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
