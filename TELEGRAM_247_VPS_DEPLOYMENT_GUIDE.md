# 🤖 TELEGRAM 24/7 AI COO BOT — VPS DEPLOYMENT GUIDE
**How to deploy `telegram-coo-bot.js` onto a 24/7 Virtual Private Server (VPS) in 3 minutes using PM2!**

---

## 🌟 WHY DEPLOY ON A VPS?
Running your AI Executive COO Bot on a 24/7 VPS (Ubuntu / Debian / CentOS / Windows) ensures that your AI assistant never sleeps, never disconnects, and is always ready to answer your executive commands on Telegram from your phone or laptop!

---

## 📋 4-STEP DEPLOYMENT ON LINUX VPS (UBUNTU / DEBIAN)

### Step 1: Install Node.js & PM2 Process Manager
Connect to your VPS via SSH and run:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
```

### Step 2: Clone Repository & Install Dependencies
```bash
git clone https://github.com/tdpeta754-design/ai-micropayment-network.git
cd ai-micropayment-network
npm install
npm install node-telegram-bot-api dotenv axios
```

### Step 3: Configure your Telegram Bot Token & Chat ID
Create a `.env` file in the project folder with your exact credentials:
```bash
cat <<EOF > .env
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN_FROM_BOTFATHER"
CHAIRMAN_CHAT_ID="YOUR_TELEGRAM_CHAT_ID"
EOF
```
*(To find your Chat ID, message `@userinfobot` on Telegram).*

### Step 4: Launch 24/7 with PM2 & Auto-Restart on Reboot
Start the bot in the background:
```bash
pm2 start telegram-coo-bot.js --name "aimpn-coo"
```

Save the process list and enable automatic startup if the VPS ever reboots:
```bash
pm2 save
pm2 startup
```

---

## 🛠️ ESSENTIAL PM2 MANAGEMENT COMMANDS
* **View live logs & AI conversations:** `pm2 logs aimpn-coo`
* **Check running status & CPU/Memory:** `pm2 status` or `pm2 monit`
* **Restart the bot after updates:** `pm2 restart aimpn-coo`
* **Stop the bot:** `pm2 stop aimpn-coo`

---
*Once running, open Telegram on your phone and send `/start` to your bot. Your 24/7 Autonomous AI Executive Partner is ready!*
