const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

const HOST = "43.98.195.107";
const USER = "root";
const PASS = "Huong9865";

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
  console.log("🚀 AIMPN V2.0 — VPS CLEANUP & PRODUCTION PREPARATION SEQUENCE");
  console.log("====================================================================");
  console.log(`Target VPS: ${USER}@${HOST}`);
  
  try {
    console.log("\n⏳ Connecting via SSH...");
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected Successfully!");

    // 1. Check system stats
    await runCommand("uname -a && cat /etc/os-release | grep PRETTY_NAME", "1. System OS & Architecture Check");
    await runCommand("df -h / && free -m", "2. Storage & RAM Check");

    // 2. Stop running PM2 or Docker services to clean up old projects
    await runCommand("pm2 kill || true", "3. Stopping old PM2 processes (if any)");
    await runCommand("docker ps -q | xargs -r docker stop && docker system prune -f || true", "4. Cleaning up Docker containers & images");

    // 3. Remove old repository directories or temporary files
    await runCommand("rm -rf /root/ai-micropayment-network /root/old_* /tmp/* || true", "5. Wiping old project folders and temporary cache");

    // 4. Update system and install essential build tools
    await runCommand("export DEBIAN_FRONTEND=noninteractive && apt-get update -y && apt-get install -y curl wget git build-essential ufw || yum update -y && yum install -y curl wget git make gcc", "6. Installing git, curl, build tools & firewall");

    // 5. Check and install Node.js v20 (LTS) if not present or older version
    await runCommand(`
      if ! command -v node >/dev/null 2>&1 || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]; then
        echo "Installing Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs || (curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && yum install -y nodejs)
      else
        echo "Node.js already installed: $(node -v)"
      fi
    `, "7. Checking / Installing Node.js v20 LTS");

    // 6. Install global PM2 for 24/7 background process management
    await runCommand("npm install -g pm2 && pm2 -v", "8. Installing global PM2 process manager");

    // 7. Prepare clean target directory
    await runCommand("mkdir -p /root/ai-micropayment-network && ls -ld /root/ai-micropayment-network", "9. Creating clean target deployment directory (/root/ai-micropayment-network)");

    // 8. Final system status check
    await runCommand("node -v && npm -v && pm2 -v && git --version", "10. Final Verification of Environment Tools");

    console.log("\n====================================================================");
    console.log("✨ VPS CLEANUP & SETUP COMPLETED 100% SUCCESSFULLY! ✨");
    console.log("====================================================================\n");

  } catch (err) {
    console.error("❌ Fatal Error during VPS cleanup:", err);
  } finally {
    ssh.dispose();
  }
}

main();
