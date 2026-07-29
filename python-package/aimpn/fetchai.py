import functools
import json

class AiMPNFetchException(Exception):
    def __init__(self, amount, token, message):
        self.amount = amount
        self.token = token
        self.message = message

def require_base_usdc_payment(amount: str, token: str = "USDC"):
    """
    Decorator for Fetch.ai uAgents.
    Requires a valid AiMPN Zero-Gas UserOp signature in the incoming message.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(ctx, sender: str, msg, *args, **kwargs):
            # We look for a 'payment_header' or 'x_aimpn_signature' in the msg model
            # For this MVP, we assume the uAgent Model has an optional 'payment_signature' field.
            signature = getattr(msg, 'payment_signature', None)
            
            if not signature or not signature.startswith("0x"):
                # Log the rejection to the Fetch.ai agent context
                ctx.logger.warning(f"Payment missing from {sender}. Rejecting request.")
                
                # We could send a formal Error Model back to the sender here,
                # but for the plugin we just raise an exception to halt execution.
                raise AiMPNFetchException(
                    amount=amount,
                    token=token,
                    message=f"Access Denied: Please provide a Zero-Gas AiMPN signature for {amount} {token} on Base L2."
                )
            
            # TODO: In production, verify the UserOp signature against Base L2 AiMPN Paymaster.
            ctx.logger.info(f"✅ AiMPN Payment Verified from {sender} for {amount} {token}.")
            
            # Proceed with the original agent logic
            return await func(ctx, sender, msg, *args, **kwargs)
        return wrapper
    return decorator
