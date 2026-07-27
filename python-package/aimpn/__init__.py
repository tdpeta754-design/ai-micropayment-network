"""
AiMPN v2.0 — AI Micropayment Network Python SDK
Official x402 Zero-Gas Micropayment Paywall for HuggingFace Spaces & AI Agents.
"""

from .x402 import require_x402_payment, AiMPNx402Exception

__version__ = "2.0.0"
__all__ = ["require_x402_payment", "AiMPNx402Exception"]
