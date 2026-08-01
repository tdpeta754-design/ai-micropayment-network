# Security Policy

At AiMPN (AI Micropayment Network), security is our absolute highest priority. Since this protocol deals with autonomous M2M value transfer on Base L2, we adhere to a policy of **Radical Transparency**.

## 🚨 Current Security Status: Experimental Alpha
**AiMPN is currently an early-stage prototype (Alpha).**
- The smart contracts handling USDC payments have **NOT** been audited by an independent third-party security firm.
- The `AI Sentinel` and `Smart Wallet` modules are experimental.
- **DO NOT** fund any AiMPN Agent wallet with significant capital. We strongly recommend a maximum of **5 USDC** per wallet for testing purposes.

## Security Architecture & Blast Radius Containment
While awaiting a formal audit, we have implemented hardcoded mechanical guardrails to mathematically limit the "blast radius" in the event of an exploit:
1. **Mathematical Daily Spend Limits:** Smart Wallets enforce a strict daily spend limit at the EVM level. Even if an AI agent goes rogue or the off-chain API is compromised, the contract will revert any transaction exceeding the daily limit (default max: 10 USDC).
2. **Standardized Primitives:** 90% of our contract logic relies on audited, battle-tested libraries including `OpenZeppelin v5` and `@account-abstraction v0.6` (ERC-4337). Our custom code is strictly limited to the `PaymentRouter` and Escrow logic.
3. **Automated Static Analysis:** Every commit is analyzed by `Slither` (Trail of Bits) via GitHub Actions to catch common vulnerabilities before deployment.

## 🐛 Community Bug Bounty Program
Since we are an open-source solo-founder project, we rely heavily on the community and white-hat hackers to stress-test our codebase.
We are offering bounties for critical vulnerability disclosures in our Base Mainnet contracts:

- **Critical Smart Contract Vulnerability (e.g., draining Escrow funds, bypassing daily limits):** Up to **1,000 USDC**
- **High Severity (e.g., griefing the Paymaster):** Up to **250 USDC**

### How to Report a Vulnerability
Please do **not** open a public issue for security vulnerabilities.
Instead, privately email: `security@aimpn.network` (or direct message the founder on X/Discord).
We will acknowledge receipt within 24 hours and provide a timeline for resolution and bounty payout.
