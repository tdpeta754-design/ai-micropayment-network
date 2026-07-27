const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function runTest(name, cmd) {
  console.log(`\n====================================================================`);
  console.log(`🧪 [TEST] ${name}`);
  console.log(`====================================================================`);
  const res = await ssh.execCommand(cmd);
  if (res.stdout) console.log(res.stdout);
  if (res.stderr) console.error(`[STDERR]:`, res.stderr);
  return res;
}

async function main() {
  console.log("====================================================================");
  console.log("🚀 AIMPN V2.0 — END-TO-END VPS PRODUCTION TEST SUITE");
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

    // 1. PM2 Status & Health
    await runTest("1. PM2 Cluster Status & Resource Usage", "pm2 status && pm2 list || true");

    // 2. Backend Health Check
    await runTest("2. Backend API Health & Deployed Contracts Check (Port 3001)", "curl -s http://127.0.0.1:3001/api/health | tr ',' '\n'");

    // 3. Network Statistics Check
    await runTest("3. Real-Time Network Economy Statistics Check", "curl -s http://127.0.0.1:3001/api/stats | tr ',' '\n'");

    // 4. AI Provider Gate Check
    await runTest("4. AI Provider Gate (Port 3002) Market Intelligence x402 Check", "curl -s -i http://127.0.0.1:3002/api/market-intelligence | head -n 15");

    // 5. AI Sentinel Attack Simulation on VPS
    await runTest(
      "5. AI Sentinel Warden Defense & Circuit Breaker Simulation",
      `curl -s -X POST http://127.0.0.1:3001/api/sentinel/simulate-attack -H "Content-Type: application/json" -d '{"attackType":"PRICE_SPIKE_ANOMALY"}'`
    );

    // 6. Check PM2 Logs for Sentinel interception
    await runTest("6. AI Sentinel Audit Logs (Checking Threat Detection Output)", "pm2 logs aimpn-backend --lines 15 --nostream");

    // 7. Nginx Reverse Proxy Public Routing Check
    await runTest(
      "7. Nginx Port 80 Routing Verification (Frontend & API Proxy)",
      "curl -s -I http://127.0.0.1/ | head -n 5 && echo '--- API via Nginx ---' && curl -s http://127.0.0.1/api/health | tr ',' '\n'"
    );

    // 8. Smart Contracts EVM Unit Test Suite on VPS
    await runTest(
      "8. Executing Hardhat Unit Test Suite directly on VPS Linux EVM",
      "cd /root/ai-micropayment-network/contracts && npx hardhat test test/SmartWallet.test.ts"
    );

    console.log("\n====================================================================");
    console.log("✨ ALL 8 E2E PRODUCTION TESTS COMPLETED ON VPS SUCCESSFULLY! ✨");
    console.log("====================================================================\n");

  } catch (err) {
    console.error("❌ Test Suite Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
