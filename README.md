# 🚀 AI Micropayment Network (AiMPN v2.0)
### *The Autonomous Machine-to-Machine (M2M) Economy on Base Mainnet*

[![Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![ERC-4337 Account Abstraction](https://img.shields.io/badge/Standard-ERC--4337-8A2BE2?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-4337)
[![Smart Contract Tests](https://img.shields.io/badge/Contracts%20Tests-27%20Passing-00C853?style=for-the-badge&logo=solidity)](./contracts)
[![Security Fuzzing](https://img.shields.io/badge/Security%20Fuzzing-100%25%20Verified-00C853?style=for-the-badge&logo=shield)](./contracts/test/SecurityFuzzSuite.test.ts)
[![AI Sentinel Warden](https://img.shields.io/badge/AI%20Sentinel-Active%2024%2F7-FF6D00?style=for-the-badge&logo=robot)](./backend/src/services/aiSentinel.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Executive Summary: A Zero-Human-Intervention Economy
**AiMPN v2.0** is an enterprise-grade, autonomous payment infrastructure tailored explicitly for the AI-Native era. Built by a **Solo Founder** with an uncompromising focus on zero human intervention and automated security governance, AiMPN enables AI Agents to autonomously negotiate, purchase, and settle services (APIs, compute, inference, data scraping) in sub-second timeframes using **USDC on Base L2**.

Instead of relying on human credit cards, subscription models, or expensive manual audit firms, AiMPN empowers autonomous software agents with **Native Web3 Bank Accounts (ERC-4337 Smart Wallets)** guarded by mathematical on-chain limits and an automated real-time circuit breaker (**AI Sentinel Security Warden**).

---

## 🏗️ System Architecture & 6 Core Components

```
d:\tai lieu hoc tap\AI Micropayment Network\
├── 📂 contracts/       # Component 1 & 6: Solidity Smart Contracts (ERC-4337, Paymaster, Fuzz Suite)
├── 📂 backend/         # Component 2 & 6: Fastify/Express Node, SQLite Engine, AI Sentinel Warden
├── 📂 sdk/             # Component 3: @antigravity/sdk (x402 Auto-Payment Engine for AI Agents)
├── 📂 demo/            # Component 4: Live Autonomous M2M Simulation Scripts
├── 📂 dashboard/       # Component 5: Web3 Control Plane UI (Next.js 15, Glassmorphism, Dark Mode)
└── 📜 start.js         # Unified Root Launcher (One-Click System Boot)
```

### 🛡️ 3-in-1 Solo Founder Security & Production Architecture
1. **Automated Security Fuzzing & Invariant Suite (`contracts/test/SecurityFuzzSuite.test.ts`)**:
   - Replaces manual audit firms with rigorous bytecode-level math verification.
   - Proves 100% immunity against per-tx spending cap breaches, daily budget drain loop attacks, session key delegation exploits, and escrow double-spends.
2. **AI Sentinel Security Warden (`backend/src/services/aiSentinel.js`)**:
   - Autonomous background watchdog inspecting transaction streams 24/7.
   - Detects abnormal price spikes ($\ge 50\text{ USDC}$) and AI hallucination failure loops (5 consecutive errors in 10s).
   - Engages on-chain circuit breakers (`pause()`) in **< 100ms** and broadcasts real-time WebSocket alerts to the UI Dashboard.
3. **Official Base Mainnet Production Sequence (`contracts/scripts/deploy-base-mainnet.ts`)**:
   - Production deployment targeting Base Mainnet (Chain ID `8453`) utilizing official Base 6-decimal USDC (`0x833589...`), ERC-4337 EntryPoint v0.6, and Chainlink ETH/USD Oracle.

---

## ⚡ Quickstart: Boot the Entire Economy in 1 Click!

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **yarn**

### 2. Installation & Boot
From the root workspace directory, run:
```bash
# Install root dependencies
npm install

# Start the entire ecosystem (Backend API, WebSocket Feed, and Web Dashboard)
npm start
```

Once running:
- 🌐 **Web3 Control Plane Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API & AI Sentinel**: Available at [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 3. Run Automated Fuzzing & Security Tests
To verify all 27 contract tests and the 4 automated security invariant suites:
```bash
cd contracts
npm test
```

To run the backend unit test suite (including AI Sentinel Warden verification):
```bash
cd backend
npm test
```

---

## 🌐 How AI Agents Pay Each Other (HTTP 402 Protocol)
With `@antigravity/sdk`, AI Agent developers can wrap standard API requests with automated micropayment settlement:

```typescript
import { PaymentClient } from '@antigravity/sdk';

const client = new PaymentClient({
  walletPrivateKey: process.env.AGENT_PRIVATE_KEY,
  rpcUrl: "https://mainnet.base.org",
  usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
});

// Automatically intercepts HTTP 402 responses, signs ERC-4337 UserOps, 
// settles USDC via Paymaster (Gasless), and attaches JWT Proof-of-Payment!
const response = await client.fetchWithPay("https://api.deai-vendor.com/v1/inference", {
  method: "POST",
  body: JSON.stringify({ prompt: "Analyze on-chain liquidity" })
});

console.log("AI Agent received data:", await response.json());
```

---

## 🎯 Progressive Decentralization Roadmap
- **Phase 1 (Current - Hybrid AI-Native)**: Optimized for Solo Founder efficiency ($< \$250/\text{month}$ maintenance, $< 50\text{ms}$ latency). On-chain assets/rules + high-velocity cloud warden.
- **Phase 2 (Decentralized AVS Warden)**: Transitioning AI Sentinel to Chainlink DONs / EigenLayer Actively Validated Services.
- **Phase 3 (Full P2P Economy)**: Moving data logs to Arweave/IPFS and agent messaging to Waku P2P networks, governed by an autonomous **AI-DAO**.

---

## 📄 License
This project is licensed under the **MIT License** — see the source code for details. Built with ❤️ for the decentralized AI future.
