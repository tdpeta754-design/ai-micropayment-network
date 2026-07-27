# 🤖 aimpn — Official Python SDK for AI Micropayment Network v2.0
**Zero-Gas x402 Micropayment Paywalls for HuggingFace Spaces, Gradio, FastAPI, and AI Agents on Base Mainnet (L2).**

[![PyPI version](https://img.shields.io/pypi/v/aimpn.svg)](https://pypi.org/project/aimpn/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet-blue)](https://base.org)

---

## ⚡ Installation
```bash
pip install aimpn
```

## 🚀 Quick Start (HuggingFace Spaces / Gradio / FastAPI)
Add an instant zero-gas x402 paywall to any AI model inference endpoint in just 1 line of code:

```python
from aimpn import require_x402_payment

@require_x402_payment(amount="0.01", recipient="0xYourBaseWalletAddress", model_name="Llama-3-70B Space")
def predict(prompt: str, payment_header: str = None):
    # Your standard AI generation logic here
    return f"🤖 AI Generated response for: {prompt}"
```

## 🎁 Why developers love this
When an AI agent calls your monetized endpoint without a payment header, `aimpn` automatically returns an HTTP **`402 Payment Required`** exception with full instructions on how to send the $0.01 USDC micropayment using our **Zero-Gas ERC-4337 Paymaster (`0x7Df0AA...`)**.

**Bonus:** Builders who call your endpoint 100 times automatically receive a **$10.00 USDC Builder Bounty** from our on-chain indexer!

---
*Visit https://github.com/tdpeta754-design/ai-micropayment-network for full documentation and interactive playgrounds.*
