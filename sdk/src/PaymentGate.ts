import axios from 'axios';
import { GateOptions } from './types';

export class PaymentGate {
  static requirePayment(options: GateOptions) {
    return async (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.setHeader('Www-Authenticate', `x402 amount="${options.amount}", recipient="${options.recipient}", currency="USDC"`);
        return res.status(402).json({
          error: "Payment Required",
          amount: options.amount,
          recipient: options.recipient,
          currency: "USDC",
          network: "base-sepolia",
          purpose: options.purpose
        });
      }

      const token = authHeader.split(' ')[1];

      try {
        const backendUrl = options.backendUrl || 'http://localhost:3001';
        const validationResponse = await axios.post(`${backendUrl}/api/payments/validate-token`, { token });

        if (validationResponse.data.valid) {
            const payload = validationResponse.data.payload;
            if (payload.aud.toLowerCase() !== options.recipient.toLowerCase()) {
                 return res.status(403).json({ error: "Invalid recipient in payment proof" });
            }
            if (parseFloat(payload.amount) < parseFloat(options.amount)) {
                return res.status(403).json({ error: "Insufficient payment amount" });
            }

            req.paymentProof = payload;
            next();
        } else {
            return res.status(403).json({ error: "Invalid or expired payment proof" });
        }
      } catch (error) {
        return res.status(403).json({ error: "Invalid or expired payment proof" });
      }
    };
  }
}

export const requirePayment = PaymentGate.requirePayment;
