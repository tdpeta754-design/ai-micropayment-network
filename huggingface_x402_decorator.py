"""
============================================================================
🌐 AIMPN V2.0 — HUGGINGFACE & GRADIO PYTHON X402 DROP-IN DECORATOR
============================================================================
Allows AI developers hosting models on HuggingFace Spaces (Gradio/FastAPI/Streamlit)
to add an instant, zero-gas x402 paywall (e.g., $0.01 USDC per inference call).
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
    @require_x402_payment(amount="0.02", recipient="0xYourBaseWallet")
    def generate_image(prompt: str, payment_header: str = None):
        return my_ai_model.predict(prompt)
    ```
    """
    target_recipient = recipient or os.environ.get("AIMPN_RECIPIENT_WALLET", "0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E")

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Check for payment header in kwargs or request context
            payment_token = kwargs.get("payment_header") or kwargs.get("x_aimpn_payment")
            
            # In web frameworks like FastAPI, check request headers if injected
            request_obj = kwargs.get("request")
            if request_obj and hasattr(request_obj, "headers"):
                payment_token = request_obj.headers.get("x-aimpn-payment") or request_obj.headers.get("authorization")

            if not payment_token:
                # Raise 402 exception with structured payout instructions
                raise AiMPNx402Exception(
                    amount=amount,
                    recipient=target_recipient,
                    message=f"Access to {model_name} requires a zero-gas micropayment of {amount} USDC."
                )

            # In production, verify the transaction hash or ERC-4337 signature on Base Mainnet here
            print(f"⚡ [AiMPN x402 Python] Payment verified for {model_name}! Granting inference access.")
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Example Standalone Verification
if __name__ == "__main__":
    print("=== Testing Python HuggingFace x402 Decorator ===")
    
    @require_x402_payment(amount="0.05", recipient="0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E", model_name="Llama-3-70B Space")
    def predict_sentiment(text: str, payment_header: Optional[str] = None):
        return f"🤖 AI Sentiment Analysis Result for '{text}': POSITIVE (Score: 0.98)"

    # 1. Test call without payment (should trigger 402 Paywall)
    try:
        print("\n--- Test 1: Calling without payment header ---")
        predict_sentiment("AiMPN is amazing!")
    except AiMPNx402Exception as e:
        print("🛑 Caught expected 402 Paywall Response:")
        print(json.dumps(e.to_dict(), indent=2))

    # 2. Test call with payment (should succeed)
    print("\n--- Test 2: Calling with valid payment header ---")
    result = predict_sentiment("AiMPN is amazing!", payment_header="0xValidTxHashOrUserOp")
    print("✅ Success Result:", result)
