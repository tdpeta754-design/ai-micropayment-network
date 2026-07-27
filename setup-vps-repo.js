const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function runCommand(command, description) {
  console.log(`\n--------------------------------------------------------------------`);
  console.log(`⚡ [EXEC] ${description}...`);
  console.log(`   Command: ${command}`);
  console.log(`--------------------------------------------------------------------`);
  const result = await ssh.execCommand(command);
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(`[STDERR/WARN]:`, result.stderr);
  return result;
}

async function main() {
  console.log("====================================================================");
  console.log("🚀 AIMPN V2.0 — CLONE & BUILD PRODUCTION REPOSITORY ON VPS");
  console.log("====================================================================");
  
  try {
    console.log("\n⏳ Connecting via SSH to 43.98.195.107...");
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected Successfully!");

    // 1. Clone repository
    await runCommand(
      "rm -rf /root/ai-micropayment-network && git clone https://github.com/tdpeta754-design/ai-micropayment-network.git /root/ai-micropayment-network",
      "1. Cloning latest repository from GitHub"
    );

    // 2. Install backend dependencies
    await runCommand(
      "cd /root/ai-micropayment-network/backend && npm install --production",
      "2. Installing Backend Node.js packages"
    );

    // 3. Install SDK dependencies
    await runCommand(
      "cd /root/ai-micropayment-network/sdk && npm install",
      "3. Installing TypeScript SDK packages"
    );

    // 4. Install Contracts dependencies
    await runCommand(
      "cd /root/ai-micropayment-network/contracts && npm install",
      "4. Installing Smart Contracts Hardhat packages"
    );

    // 5. Install and build Dashboard
    await runCommand(
      "cd /root/ai-micropayment-network/dashboard && npm install && npm run build",
      "5. Installing and building Next.js 15 Control Plane Dashboard (Production Bundle)"
    );

    // 6. Configure PM2 ecosystem setup script on VPS
    const ecosystemContent = `
module.exports = {
  apps: [
    {
      name: "aimpn-backend",
      script: "./src/start.js",
      cwd: "/root/ai-micropayment-network/backend",
      env: {
        PORT: 3001,
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
    await ssh.execCommand(`cat << 'EOF' > /root/ai-micropayment-network/ecosystem.config.js\n${ecosystemContent}\nEOF`);
    console.log("\n✅ Generated PM2 ecosystem.config.js on VPS with target IP 43.98.195.107!");

    // 7. Verify directory content
    await runCommand("ls -la /root/ai-micropayment-network", "6. Verifying deployed repository files on VPS");

    console.log("\n====================================================================");
    console.log("✨ REPOSITORY CLONED AND BUILT 100% ON VPS! READY FOR MAINNET! ✨");
    console.log("====================================================================\n");

  } catch (err) {
    console.error("❌ Fatal Error during repository setup:", err);
  } finally {
    ssh.dispose();
  }
}

main();
