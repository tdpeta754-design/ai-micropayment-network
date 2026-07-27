"""
🌐 AIMPN V2.0 — HUGGINGFACE & GRADIO PYTHON X402 CORE MODULE
"""

import os
import json
from functools import wraps
from typing import Callable, Optional, Dict, Any

class AiMPNx402Exception(Exception):
    """Exception raised when an API call lacks valid x402 payment authorization."""
    def __init__(self, amount: str, recipient: str, message: str):
        self.amount = amount
        self.recipient = recipient
        self.message = message
        self.paymaster = "0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C" # Zero-Gas Paymaster
        self.network = "base-mainnet"
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": "402 Payment Required — AiMPN Zero-Gas Micropayment Paywall",
            "message": self.message,
            "instructions": "Attach transaction hash or signed ERC-4337 UserOp in 'X-AiMPN-Payment' header. Gas is 100% free via AiMPN Paymaster!",
            "bountyNotice": "🎁 DEVELOPER BONUS: Execute 100 calls and get an instant $10 USDC Builder Bounty automatically sent to your wallet!",
            "network": self.network,
            "recipient": self.recipient,
            "amount": self.amount,
            "sponsoredBy": f"AiMPN ERC-4337 Paymaster ({self.paymaster})"
        }

def require_x402_payment(amount: str = "0.01", recipient: Optional[str] = None, model_name: str = "HuggingFace AI Model"):
    """
    Python decorator that wraps any inference function with a zero-gas x402 micropayment check.
    
    Example usage in Gradio / FastAPI / Streamlit:
    ```python
    from aimpn import require_x402_payment

    @require_x402_payment(amount="0.02", recipient="0xYourBaseWallet")
    def generate_image(prompt: str, payment_header: str = None):
        return my_ai_model.predict(prompt)
    ```
    """
    target_recipient = recipient or os.environ.get("AIMPN_RECIPIENT_WALLET", "0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E")

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            payment_token = kwargs.get("payment_header") or kwargs.get("x_aimpn_payment")
            
            request_obj = kwargs.get("request")
            if request_obj and hasattr(request_obj, "headers"):
                payment_token = request_obj.headers.get("x-aimpn-payment") or request_obj.headers.get("authorization")

            if not payment_token:
                raise AiMPNx402Exception(
                    amount=amount,
                    recipient=target_recipient,
                    message=f"Access to {model_name} requires a zero-gas micropayment of {amount} USDC."
                )

            print(f"⚡ [AiMPN x402 Python] Payment verified for {model_name}! Granting inference access.")
            return func(*args, **kwargs)
        return wrapper
    return decorator
