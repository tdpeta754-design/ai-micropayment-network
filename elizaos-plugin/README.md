# @aimpn/elizaos-plugin

The official **AI Micropayment Network (AiMPN)** plugin for ElizaOS.

This plugin empowers your ElizaOS agents with a native Web3 bank account, allowing them to autonomously pay for APIs, compute, and data using **USDC on Base L2**. Thanks to AiMPN's Paymaster infrastructure, your agents do **NOT** need to hold ETH to pay for gas fees (Zero-Gas).

## 🚀 Installation & Usage (1-Line Integration)

Integrating AiMPN into your ElizaOS character takes exactly one line of code.

1. Install the plugin:
```bash
npm install @aimpn/elizaos-plugin
```

2. Add it to your Eliza character configuration:
```typescript
import { Character } from "@elizaos/core";
import { aimpnPlugin } from "@aimpn/elizaos-plugin"; // 👈 Import the plugin

export const myAgent: Character = {
    name: "DataBuyerAgent",
    plugins: [aimpnPlugin], // 👈 Inject into the plugins array
    // ... other config
};
```

## 🛠️ Provided Actions
Once installed, your agent automatically learns the following action:
- `PAY_USDC_M2M`: Triggers when the user or another agent asks to pay, send, or buy something using USDC.

### Example Chat
**User:** "Agent, please pay 5 USDC to 0x123... for the weather data API."
**Eliza Agent:** "I have successfully paid 5 USDC to 0x123... via AiMPN. The gas was sponsored. Here is your transaction hash: 0xabcd..."

## 🚨 Security Note
This plugin is currently in **Experimental Alpha**. It utilizes AiMPN's EVM Circuit Breakers to strictly limit daily spending, but it has not been audited by a third party. Do not fund your agent's wallet with large amounts of capital.
