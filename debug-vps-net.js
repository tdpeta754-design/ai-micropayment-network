const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();

require("dotenv").config();
const HOST = process.env.VPS_HOST || "43.98.195.107";
const USER = process.env.VPS_USER || "root";
const PASS = process.env.VPS_PASS || process.env.VPS_PASSWORD;

async function main() {
  console.log("====================================================================");
  console.log("🔍 AIMPN V2.0 — DEBUGGING NETWORK & FIREWALL ON VPS");
  console.log("====================================================================");
  
  try {
    await ssh.connect({
      host: HOST,
      username: USER,
      password: PASS,
      readyTimeout: 20000
    });
    console.log("✅ SSH Connected!");

    console.log("\n1. Checking listening ports (3000, 3001, 3002, 80)...");
    const ports = await ssh.execCommand("ss -tuln | grep -E '3000|3001|3002|80'");
    console.log(ports.stdout || "No ports matching found!");

    console.log("\n2. Testing local HTTP response inside VPS...");
    const curl3000 = await ssh.execCommand("curl -I -s http://127.0.0.1:3000 | head -n 3");
    console.log("[Port 3000 Dashboard]:", curl3000.stdout || curl3000.stderr);
    const curl3001 = await ssh.execCommand("curl -s http://127.0.0.1:3001/api/health");
    console.log("[Port 3001 Backend]  :", curl3001.stdout || curl3001.stderr);

    console.log("\n3. Checking OS firewalls (iptables / firewalld / ufw)...");
    const fw = await ssh.execCommand("iptables -L INPUT -n --line-numbers | head -n 15");
    console.log(fw.stdout);

    console.log("\n4. Installing and configuring Nginx Reverse Proxy on Port 80 (Standard HTTP)...");
    await ssh.execCommand("apt-get install -y nginx || yum install -y nginx || dnf install -y nginx");
    
    const nginxConfig = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Proxy WebSocket & Backend API requests to port 3001
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Proxy Provider Gate to port 3002
    location /provider/ {
        proxy_pass http://127.0.0.1:3002/;
        proxy_set_header Host $host;
    }

    # Proxy everything else to Next.js Dashboard on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    await ssh.execCommand(`cat << 'EOF' > /etc/nginx/conf.d/aimpn.conf\n${nginxConfig}\nEOF`);
    await ssh.execCommand(`cat << 'EOF' > /etc/nginx/sites-available/default\n${nginxConfig}\nEOF || true`);
    
    console.log("\n🔄 Testing and restarting Nginx...");
    const nginxTest = await ssh.execCommand("nginx -t && systemctl restart nginx && systemctl enable nginx");
    console.log(nginxTest.stdout || nginxTest.stderr);

    console.log("\n5. Testing Nginx proxy locally on Port 80...");
    const curl80 = await ssh.execCommand("curl -I -s http://127.0.0.1/ | head -n 3");
    console.log("[Port 80 Nginx Proxy]:", curl80.stdout || curl80.stderr);

    console.log("\n====================================================================");
    console.log("✨ NGINX REVERSE PROXY IS CONFIGURING! TRY ACCESSING PORT 80! ✨");
    console.log("👉 http://43.98.195.107 (No :3000 needed!)");
    console.log("====================================================================\n");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
