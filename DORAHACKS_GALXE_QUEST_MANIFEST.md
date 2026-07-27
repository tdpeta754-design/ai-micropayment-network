# 🏆 AIMPN V2.0 — OFFICIAL HACKATHON & BOUNTY QUEST MANIFEST
**Platforms:** DoraHacks, Galxe Quests, QuestN, Gitcoin, Zealy  
**Campaign Title:** 🤖 Build Autonomous AI Agents with Zero-Gas M2M Payments on Base L2 -> Get Instant $10 USDC!  
**Total Bounty Pool:** Initial 50 USDC (Auto-refilling via 100% Protocol Fee Reinvestment Loop)  
**Reward per Builder:** $10.00 USDC (Paid out instantly & autonomously on Base Mainnet)  

---

## 🌟 CAMPAIGN OVERVIEW (FOR PLATFORM LISTING)
Welcome to the **AI Micropayment Network (AiMPN v2.0)** Builder Quest on Base Mainnet! 
Are you building AI Agents using ElizaOS, LangChain, AutoGen, CrewAI, or custom scripts? Do your agents need to pay for data APIs, inference, or delegate tasks without getting stuck on gas fees or wallet security risks?

We are sponsoring **100% OF GAS FEES (ZERO GAS)** via our on-chain ERC-4337 Paymaster! You do not need a single drop of ETH to test and build on Base Mainnet.

### 🎁 The Quest Goal
Integrate our open-source `@antigravity/sdk` into your AI Agent workflow and execute **100 on-chain M2M micropayments** on Base Mainnet between two agent wallets.

### ⚡ Why Participate?
1. **Zero Gas Friction:** Our Paymaster (`0x7Df0AA...`) pays for 100% of your Base L2 transaction gas.
2. **AI Sentinel Warden:** Built-in sub-100ms automated circuit breaker that protects your agent's treasury from hallucinations and price spikes.
3. **Instant Autonomous Payout:** No manual grading or waiting weeks for hackathon judges! Our 24/7 On-Chain Indexer monitors `PaymentProcessed` events on Base Mainnet. The exact second your agent completes 100 transactions, our treasury automatically transfers **10.00 USDC** straight to your wallet!

---

## 📋 QUEST TASKS & VERIFICATION CRITERIA

### ✅ Task 1: Star & Clone the Official Repository (20 XP)
* **Action:** Star our GitHub repository and install the dependencies.
* **Link:** `https://github.com/tdpeta754-design/ai-micropayment-network`
* **Verification:** Automatic GitHub OAuth verification via Galxe/QuestN.

### ✅ Task 2: Initialize a Zero-Gas SmartWallet on Base Mainnet (30 XP)
* **Action:** Run the initialization script using `@antigravity/sdk` or ethers.js to deploy your counterfactual ERC-4337 SmartWallet.
* **Contract Factory:** `0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6`
* **Verification:** Submit your Agent SmartWallet Address starting with `0x...`.

### ✅ Task 3: Execute 100 Zero-Gas M2M Micropayments ($10 USDC Instant Bounty)
* **Action:** Have your AI Agent send 100 micro-transactions (e.g., 0.001 USDC each) to another agent or our test sink via `PaymentRouter` (`0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916`).
* **Gas Cost:** **$0.00** (Sponsored by Paymaster `0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C`).
* **Verification:** 100% Autonomous On-Chain Indexing! Once 100 transactions are confirmed on BaseScan, 10 USDC is sent automatically to your deployer wallet.

---

## 💻 3-LINE INTEGRATION SNIPPET (COPY & PASTE FOR BUILDERS)

```javascript
const { ethers } = require("ethers");

// Base Mainnet Contracts
const ROUTER = "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916";
const PAYMASTER = "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C";

// Send payment with Zero Gas!
console.log("🤖 AI Agent initiating Zero-Gas M2M payment on Base Mainnet...");
// Our 24/7 Indexer is listening! See live dashboard at http://43.98.195.107:3000
```

---

## 🌐 RESOURCES & CONTACT FOR HACKERS
* 📊 **Live Network Explorer & Stats:** `http://43.98.195.107:3000`
* 📑 **Contract Registry:** Base Mainnet Chain ID `8453`
* 🐦 **X / Twitter Support:** Tag `#AiMPN`, `@jessepollak`, and `@base` for 24/7 developer assistance!
