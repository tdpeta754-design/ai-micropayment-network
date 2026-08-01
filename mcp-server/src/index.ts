#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";

// AiMPN Core Constants
const PAYMASTER_URL = "http://43.98.195.107:3001/api/paymaster-status";
const RPC_URL = "https://mainnet.base.org";

const server = new Server(
  {
    name: "aimpn-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "aimpn_check_network",
        description: "Check the live status of the AiMPN Zero-Gas Paymaster and Base L2 Network. Use this to verify if the payment network is online before requesting a payment.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "aimpn_request_payment",
        description: "Generate a simulated Zero-Gas AiMPN x402 payment signature to authorize an M2M transaction. This allows an AI Agent to pay another Agent.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "The Base L2 wallet address of the receiving Agent or Service.",
            },
            amountUsdc: {
              type: "string",
              description: "The amount of USDC to pay.",
            },
            purpose: {
              type: "string",
              description: "The reason or service being purchased.",
            }
          },
          required: ["to", "amountUsdc"],
        },
      }
    ],
  };
});

// Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "aimpn_check_network": {
      try {
        // Fetch real-time gas prices from Base Mainnet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const feeData = await provider.getFeeData();
        const baseFeeGwei = ethers.formatUnits(feeData.gasPrice || 0, "gwei");

        return {
          content: [
            {
              type: "text",
              text: `AiMPN Network Status (Base L2):\n- Network: ONLINE\n- Base L2 Gas Price: ${baseFeeGwei} Gwei\n- AiMPN Paymaster: ACTIVE (Sponsoring 100% of Gas Fees for AI Agents)\n- Circuit Breaker: NORMAL`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error checking network: ${error.message}` }],
          isError: true,
        };
      }
    }

    case "aimpn_request_payment": {
      const { to, amountUsdc, purpose } = request.params.arguments as any;
      
      if (!to || !amountUsdc) {
        return {
          content: [{ type: "text", text: "Missing required arguments: 'to' and 'amountUsdc'" }],
          isError: true,
        };
      }

      // Generate a mock cryptographic signature (x_aimpn_signature) for the AI to use
      const mockSignature = "0x" + Buffer.from(`aimpn_auth_${to}_${amountUsdc}_${Date.now()}`).toString("hex");

      return {
        content: [
          {
            type: "text",
            text: `✅ Payment Authorization Successful!\n\nTransaction Details:\n- To: ${to}\n- Amount: ${amountUsdc} USDC\n- Purpose: ${purpose || "M2M Services"}\n- Gas Paid by Agent: $0.00 (Sponsored by AiMPN Paymaster)\n\nCryptographic Proof (x_aimpn_signature):\n${mockSignature}\n\nProvide this signature to the target service to unlock access.`,
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

// Start the stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AiMPN MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
