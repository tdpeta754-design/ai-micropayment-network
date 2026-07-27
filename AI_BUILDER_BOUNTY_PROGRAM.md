# 🎁 AiMPN v2.0 — AI BUILDER BOUNTY PROGRAM ($10 USDC INSTANT REWARD)

Welcome to the **AI Micropayment Network (AiMPN v2.0)** Builder Bounty Program on Base Mainnet! 
We are sponsoring **100% of gas fees** for autonomous AI Agent developers building M2M payment workflows, data escrow, and x402 monetization protocols on Base L2.

To celebrate our Mainnet release, we have allocated an initial **50 USDC Bounty Pool** to reward the first 5 developers who integrate `@antigravity/sdk` into their AI frameworks (ElizaOS, LangChain, AutoGen, CrewAI, Rig, or custom scripts).

---

## 💡 THE BOUNTY RULES
1. **Goal**: Integrate `@antigravity/sdk` and execute **100 on-chain micropayment test transactions** on Base Mainnet between your AI Agent SmartWallets.
2. **Reward**: **$10 USDC** paid out instantly and automatically to your deployer wallet by our 24/7 On-Chain Indexer!
3. **Gas Cost**: **$0.00 (ZERO GAS)**! Our on-chain ERC-4337 Paymaster pool in the Base EntryPoint sponsors 100% of your gas fees. You do NOT need any ETH to test!

---

## ⚡ 2-MINUTE INTEGRATION GUIDE

### Step 1: Install the SDK & Dependencies
```bash
npm install ethers dotenv
# Or clone/import directly from our open-source repo
```

### Step 2: Initialize Your Zero-Gas SmartWallet
Create a script `my-ai-agent.js`:
```javascript
const { ethers } = require("ethers");

// AiMPN v2.0 Base Mainnet Addresses
const ROUTER_ADDRESS    = "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916";
const PAYMASTER_ADDRESS = "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C";
const USDC_ADDRESS      = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function runSwarm() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  console.log("🤖 AI Agent connecting to Base Mainnet with Free Gas Paymaster...");
  
  // Your logic to send M2M payments via PaymentRouter
  // Our 24/7 Indexer is listening to PaymentProcessed events!
}

runSwarm();
```

---

## 🤖 HOW THE INSTANT PAYOUT WORKS (ZERO HUMAN INTERVENTION)
Our autonomous **Bounty Indexer (`aimpn-bounty-engine`)** runs 24/7 on our cloud infrastructure:
1. It listens to all `PaymentProcessed(from, to, amount, nonce, purpose, fee)` events on Base Mainnet.
2. It tracks the cumulative transaction count for each unique AI Agent SmartWallet.
3. The moment your wallet hits **100 transactions**, our smart treasury automatically triggers an on-chain transfer of **10.000000 USDC ($10 USDC)** straight to your wallet address!

---

## 🌐 OFFICIAL CONTRACT REGISTRY (BASE MAINNET - CHAIN ID: 8453)
* 🏛️ **WalletFactory**: `0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6`
* ⚡ **PaymentRouter**: `0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916`
* ⛽ **Paymaster**: `0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C`
* 💎 **Official Base USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
* 🔗 **Chainlink Oracle**: `0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70`

---

## 💬 QUESTIONS OR COLLABORATIONS?
Tag us on X/Twitter with `#AiMPN`, `@jessepollak`, and `@base` to join the autonomous Web3 AI movement! Let's scale to 1M daily AI transactions! 🚀
