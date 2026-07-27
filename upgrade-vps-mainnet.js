const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

// Mainnet Contract Addresses
const MAINNET_FACTORY = "0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6";
const MAINNET_ROUTER  = "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916";
const MAINNET_PAYMASTER = "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C";
const MAINNET_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
  console.log("====================================================================");
  console.log("🌐 AIMPN V2.0 — UPGRADING VPS TO BASE MAINNET PRODUCTION MODE");
  console.log("====================================================================");

  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected to VPS!");

    console.log("\n📥 Pulling latest Git repo (with base-mainnet.json deployments)...");
    await ssh.execCommand("cd /root/ai-micropayment-network && git pull origin main");

    console.log("\n⚙️ Updating backend/.env to Base Mainnet addresses...");
    const backendEnv = `PORT=3001
NODE_ENV=production
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
FACTORY_ADDRESS=${MAINNET_FACTORY}
ROUTER_ADDRESS=${MAINNET_ROUTER}
PAYMASTER_ADDRESS=${MAINNET_PAYMASTER}
USDC_ADDRESS=${MAINNET_USDC}
AI_SENTINEL_ENABLED=true
SENTINEL_MAX_GAS_PRICE_GWEI=50
`;
    await ssh.execCommand(`cat << 'EOF' > /root/ai-micropayment-network/backend/.env
${backendEnv}
EOF`);
    console.log("✅ Backend env configured for Base Mainnet!");

    console.log("\n⚙️ Updating dashboard/.env.local to Base Mainnet addresses...");
    const dashboardEnv = `NEXT_PUBLIC_API_URL=http://43.98.195.107:3001
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_FACTORY_ADDRESS=${MAINNET_FACTORY}
NEXT_PUBLIC_ROUTER_ADDRESS=${MAINNET_ROUTER}
NEXT_PUBLIC_PAYMASTER_ADDRESS=${MAINNET_PAYMASTER}
NEXT_PUBLIC_USDC_ADDRESS=${MAINNET_USDC}
`;
    await ssh.execCommand(`cat << 'EOF' > /root/ai-micropayment-network/dashboard/.env.local
${dashboardEnv}
EOF`);
    console.log("✅ Dashboard env configured for Base Mainnet!");

    console.log("\n🏗️ Rebuilding Next.js Dashboard for Mainnet...");
    const build = await ssh.execCommand("cd /root/ai-micropayment-network/dashboard && npm run build");
    console.log(build.stdout || build.stderr);

    console.log("\n🔄 Restarting all PM2 services (backend, dashboard, provider)...");
    const pm2 = await ssh.execCommand("pm2 restart all && pm2 status");
    console.log(pm2.stdout);

    console.log("\n====================================================================");
    console.log("✨ VPS SUCCESSFULLY SWITCHED TO BASE MAINNET LIVE OPERATIONS! ✨");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
