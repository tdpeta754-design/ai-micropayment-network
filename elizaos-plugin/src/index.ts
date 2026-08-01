import { Plugin } from "@elizaos/core";
import { payM2mAction } from "./actions/payM2m.js";

/**
 * AiMPN (AI Micropayment Network) Plugin for ElizaOS
 * 
 * Enables autonomous M2M (Machine-to-Machine) payments using USDC on Base L2.
 * Powered by ERC-4337 Account Abstraction (Zero-Gas).
 */
export const aimpnPlugin: Plugin = {
    name: "aimpn",
    description: "Official AiMPN Plugin for ElizaOS. Enables Zero-Gas USDC micropayments on Base L2.",
    actions: [payM2mAction],
    evaluators: [],
    providers: [],
    services: [],
};

export default aimpnPlugin;
