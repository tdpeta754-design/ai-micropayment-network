# ⚡ AiMPN Quickstart: Zero-Gas Agent Payments in 5 Lines

The AiMPN protocol allows your AI Agents (ElizaOS, LangChain, Fetch.ai) to demand USDC payments without ever paying for gas. **Our Paymaster handles the gas fees on Base L2.**

Here is the exact code to monetize your agent in 5 lines:

```python
from aimpn import AiMPN
from aimpn.eliza import require_payment

aimpn = AiMPN(network="base-mainnet", paymaster="sponsored")

@require_payment(amount="0.5", token="USDC", engine=aimpn)
def get_premium_data(query: str):
    return "This data cost 0.5 USDC to access. Gas was 0.00!"
```

### 💧 Faucet & Paymaster
- Need test USDC? Visit our [Discord Faucet](#).
- **Paymaster Limits:** Currently sponsoring up to $50/day in gas fees per developer. No ETH required in your agent's wallet!

*Self-healing financial logic for machines. Build the Agent Economy today.*
