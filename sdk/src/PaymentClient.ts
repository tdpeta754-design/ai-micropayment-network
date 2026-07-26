import { ethers } from 'ethers';
import axios from 'axios';
import { PaymentClientConfig, PaymentResult } from './types';

const ROUTER_ABI = [
  "function processPayment(address from, address to, uint256 amount, bytes32 nonce, string calldata purpose) external",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export class PaymentClient {
  private signer?: ethers.Signer;
  private privateKey?: string;
  private walletAddress?: string;
  private routerAddress: string;
  private usdcAddress: string;
  private backendUrl: string;

  constructor(config: PaymentClientConfig) {
    this.signer = config.signer;
    this.privateKey = config.privateKey;
    this.walletAddress = config.walletAddress;
    this.routerAddress = config.routerAddress || '0x0000000000000000000000000000000000000000';
    this.usdcAddress = config.usdcAddress || '0x0000000000000000000000000000000000000000';
    this.backendUrl = config.backendUrl || 'http://localhost:3001';

    if (!this.signer && this.privateKey) {
      try {
        const provider = config.rpcUrl ? new ethers.JsonRpcProvider(config.rpcUrl) : ethers.getDefaultProvider();
        this.signer = new ethers.Wallet(this.privateKey, provider);
      } catch (e) {
        // Fallback for offline/simulation mode
      }
    }
  }

  async getSenderAddress(): Promise<string> {
    if (this.walletAddress) return this.walletAddress;
    if (this.signer && this.signer.getAddress) {
      try {
        return await this.signer.getAddress();
      } catch (e) {
        return '0xA100000000000000000000000000000000000001';
      }
    }
    return '0xA100000000000000000000000000000000000001';
  }

  async pay(recipient: string, amountUsdc: string, purpose: string = "AI Service"): Promise<PaymentResult> {
    const from = await this.getSenderAddress();
    let txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    if (this.signer && this.routerAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        const amount = ethers.parseUnits(amountUsdc, 6);
        const nonce = ethers.id(Date.now() + Math.random().toString());

        const usdcContract = new ethers.Contract(this.usdcAddress, ERC20_ABI, this.signer);
        const allowance = await usdcContract.allowance(from, this.routerAddress);
        if (allowance < amount) {
            const approveTx = await usdcContract.approve(this.routerAddress, ethers.MaxUint256);
            await approveTx.wait();
        }

        const routerContract = new ethers.Contract(this.routerAddress, ROUTER_ABI, this.signer);
        const tx = await routerContract.processPayment(from, recipient, amount, nonce, purpose);
        await tx.wait();
        txHash = tx.hash;
      } catch (e) {
        console.warn('⚠️ [PaymentClient] Live on-chain execution fallback to simulation mode:', (e as Error).message);
      }
    } else {
      console.log(`⚡ [PaymentClient] Simulating Base Sepolia on-chain transaction from ${from} to ${recipient} (${amountUsdc} USDC)...`);
    }

    const response = await axios.post(`${this.backendUrl}/api/payments/verify`, {
      txHash,
      purpose,
      amount: amountUsdc
    });

    const popToken = response.data.popToken;

    return {
      txHash,
      popToken,
      amount: amountUsdc,
      recipient,
      timestamp: Date.now()
    };
  }

  async fetchWithPay(url: string, options?: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    let amount = '';
    let recipient = '';
    let purpose = '';

    const authHeader = response.headers.get('Www-Authenticate');
    if (authHeader && authHeader.startsWith('x402')) {
        const amountMatch = authHeader.match(/amount="([^"]+)"/);
        const recipientMatch = authHeader.match(/recipient="([^"]+)"/);
        const purposeMatch = authHeader.match(/purpose="([^"]+)"/);
        amount = amountMatch ? amountMatch[1] : '';
        recipient = recipientMatch ? recipientMatch[1] : '';
        purpose = purposeMatch ? purposeMatch[1] : 'AI Service';
    } else {
        const body = await response.clone().json();
        amount = body.amount;
        recipient = body.recipient;
        purpose = body.purpose || 'AI Service';
    }

    console.log(`⚡ [x402 Auto-Pay] HTTP 402 detected! Executing micropayment of ${amount} USDC to ${recipient}...`);
    
    const paymentResult = await this.pay(recipient, amount, purpose);

    console.log(`🎟️ [x402 Auto-Pay] Proof-of-Payment token received! Retrying request with Authorization header...`);

    const headers = new Headers(options?.headers);
    headers.set('Authorization', 'Bearer ' + paymentResult.popToken);

    const newOptions: RequestInit = {
      ...options,
      headers
    };

    return fetch(url, newOptions);
  }
}
