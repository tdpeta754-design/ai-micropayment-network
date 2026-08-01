# AI Circuit Breaker Architecture

## The Problem: AI Hallucinations in Financial Contexts
When autonomous agents (LLMs) are given access to cryptographic wallets, a critical vulnerability emerges: **The Infinite Spending Loop**.
If an agent hallucinates a task requirement or gets stuck in a retry loop (e.g., constantly querying an API that is returning 500 Internal Server Error), it could drain its entire wallet balance in minutes paying for useless API calls.

## The Solution: Mechanical On-Chain Circuit Breakers
AiMPN solves this not through AI prompt engineering, but through mathematical EVM (Ethereum Virtual Machine) constraints. We treat AI agents like untrusted high-frequency trading bots.

### 1. Daily & Per-Transaction Spend Limits
Every AI Smart Wallet deployed by the AiMPN Factory contains a `SpendingPolicy` struct.
```solidity
struct SpendingPolicy {
    uint256 maxPerTransaction;
    uint256 dailyLimit;
    uint256 monthlyLimit;
    uint256 cooldownSeconds;
}
```
When the ERC-4337 `validateUserOp` is called, the contract mathematically verifies that the transaction does not exceed the `maxPerTransaction`, and that the `dailySpent + amount` does not exceed the `dailyLimit`. If it does, the EVM reverts the transaction with `error PolicyViolation()`.

*Why this matters:* Even if a private key is leaked, or the LLM goes rogue, the absolute maximum loss is mathematically contained to the daily limit (e.g., $5 USDC).

### 2. Time-Based Cooldowns
To prevent an LLM from spamming 100 API calls in 10 seconds (Rate Limit Exhaustion), the `cooldownSeconds` enforces a block-timestamp delay between successful transactions from the same agent.

### 3. Fault-Tolerant Atomic Escrows
What if the AI pays for data, but the provider API crashes and fails to deliver?
AiMPN routes payments through the `PaymentRouter`'s Escrow system.
- USDC is locked in the router.
- A cryptographic Proof-of-Delivery is required from the provider to unlock the funds.
- If the provider times out, the AI agent can call `refundEscrow()` to instantly claw back the USDC. No customer support ticket required.

## Conclusion
By shifting the security paradigm from "Trusting the AI to be smart" to "Constraining the AI with immutable math", AiMPN provides a safe playground for developers to experiment with autonomous economic agents.
