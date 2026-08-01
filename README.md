# 🤖 AI Micropayment Network (AiMPN)

**AiMPN is an experimental open-source protocol for Zero-Gas Machine-to-Machine (M2M) payments on Base L2.**

[![Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![ERC-4337 Account Abstraction](https://img.shields.io/badge/Standard-ERC--4337-8A2BE2?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-4337)
[![Slither Analysis](https://github.com/tdpeta754-design/ai-micropayment-network/actions/workflows/slither.yml/badge.svg)](https://github.com/tdpeta754-design/ai-micropayment-network/actions/workflows/slither.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> 🚨 **SECURITY NOTICE:** AiMPN is in early-stage Alpha. The smart contracts handle real USDC on Base Mainnet but **have NOT been independently audited**. This is an experimental proof-of-concept. Please read our [SECURITY.md](SECURITY.md) and do not use with significant funds.

## 🌟 What is AiMPN?
AiMPN allows AI Agents (like ElizaOS, LangChain, AutoGen) to purchase APIs, data, and compute resources from other machines using **USDC**. 
Unlike traditional wallets, AiMPN uses ERC-4337 Paymasters to sponsor 100% of the gas fees, meaning **AI Agents never need to hold ETH to transact**.

Our architecture is deeply inspired by and designed to be an implementation library compatible with standard x402 paradigms (e.g., Linux Foundation / Coinbase x402 initiatives).

## 📊 Verifiable On-Chain Data (Base Mainnet)
We believe in radical transparency. AiMPN is live on Base Mainnet. You can verify our deployed infrastructure directly on BaseScan:

- **AiMPN Wallet Factory:** [`0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6`](https://basescan.org/address/0xFdc195DB85a7178f44916E9A21Eb2A9c99Ba5fA6)
- **Zero-Gas Paymaster:** [`0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C`](https://basescan.org/address/0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C)
- **Escrow Payment Router:** [`0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916`](https://basescan.org/address/0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916)

*Example Zero-Gas Settlement Hash:* `0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d` *(Demo reference)*

## 🛡️ Core Concept: The AI Circuit Breaker
Since AI agents operate autonomously, they pose a severe financial risk if they hallucinate or get stuck in a spending loop.
AiMPN mitigates this through hardcoded **EVM Circuit Breakers**:
- **Daily Spend Limits:** Agents are mathematically capped at a specific USDC spend per day.
- **Atomic Escrows:** Funds are locked in escrow and only released when the API delivers the data (Proof-of-Delivery). If the API times out, the USDC is refunded automatically.

Read our deep-dive technical architecture here: [AI Circuit Breaker Architecture](./docs/architecture/ai_circuit_breaker.md).

## 🚀 Quickstart
Integrating AiMPN into your agent framework takes just 5 lines of code.
Check out the [QUICKSTART.md](./QUICKSTART.md) guide.

## 🤝 Contributing & Bug Bounty
We are actively looking for contributors, integrations (ElizaOS, Fetch.ai), and security researchers.
Please refer to our [SECURITY.md](SECURITY.md) for details on our Bug Bounty program.
