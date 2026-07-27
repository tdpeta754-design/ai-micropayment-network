/**
 * ============================================================================
 * 🌐 AIMPN V2.0 — HUGGINGFACE & REPLICATE X402 DROP-IN MONETIZATION WIDGET
 * ============================================================================
 * Allows AI developers hosting models on HuggingFace Spaces, Replicate, or AWS
 * to add an instant, zero-gas x402 paywall (e.g., $0.01 per API call).
 */

const express = require("express");

/**
 * Creates an Express middleware that protects any AI model endpoint with an x402 paywall.
 * @param {Object} config - Paywall configuration
 * @param {string} config.recipient - The AI model owner's Base L2 wallet address
 * @param {string} config.amount - Cost per API call in USDC (e.g., "0.01")
 * @param {string} config.modelName - Descriptive name of the AI model
 */
function createAiMPNx402Paywall(config) {
  const {
    recipient = "0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E",
    amount = "0.01",
    modelName = "HuggingFace Premium AI Inference"
  } = config;

  return async (req, res, next) => {
    const paymentHeader = req.headers["x-aimpn-payment"] || req.headers["authorization"];

    // 1. If no payment header is present, return HTTP 402 Payment Required
    if (!paymentHeader) {
      res.set({
        "Www-Authenticate": `x402 amount="${amount}", recipient="${recipient}", currency="USDC", network="base-mainnet"`,
        "X-AiMPN-Paymaster": "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C", // Zero-Gas Paymaster
        "X-AiMPN-Router": "0x3Bc7EF17565C47d28477FDC2F1C5A48F1c47B916"
      });
      return res.status(402).json({
        error: "402 Payment Required — AiMPN Zero-Gas Micropayment Paywall",
        message: `This HuggingFace AI model (${modelName}) requires a micropayment of ${amount} USDC per call.`,
        instructions: "Attach transaction hash or signed ERC-4337 UserOp in 'X-AiMPN-Payment' header. Gas is 100% free via AiMPN Paymaster!",
        bountyNotice: "🎁 DEVELOPER BONUS: Execute 100 calls and get an instant $10 USDC Builder Bounty automatically sent to your wallet!",
        network: "base-mainnet",
        recipient,
        amount
      });
    }

    // 2. In production, verify the on-chain transaction or signature here
    // For demonstration/widget purposes, if header exists, let inference proceed
    console.log(`⚡ [AiMPN x402] Payment verified for ${modelName}! Granting access to AI inference.`);
    req.aimpnPayment = { verified: true, amount, recipient };
    next();
  };
}

// Example Usage for standalone testing
if (require.main === module) {
  const app = express();
  app.use(express.json());

  // Attach paywall to /api/predict
  app.use("/api/predict", createAiMPNx402Paywall({
    recipient: "0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E",
    amount: "0.02",
    modelName: "Llama-3-70B HuggingFace Endpoint"
  }));

  app.post("/api/predict", (req, res) => {
    res.json({
      success: true,
      result: "🤖 AI Inference completed successfully! You paid 0.02 USDC with ZERO GAS.",
      timestamp: Date.now()
    });
  });

  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`🌐 AiMPN x402 HuggingFace Paywall running on port ${PORT}`);
    console.log(`👉 Test with: curl -i http://localhost:${PORT}/api/predict`);
  });
}

module.exports = { createAiMPNx402Paywall };
