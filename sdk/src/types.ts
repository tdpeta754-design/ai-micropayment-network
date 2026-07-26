import { Signer } from 'ethers';

export interface PaymentClientConfig {
  rpcUrl?: string;
  routerAddress?: string;
  usdcAddress?: string;
  walletAddress?: string;
  privateKey?: string;
  signer?: Signer;
  backendUrl?: string;
}

export interface PaymentRequest {
  recipient: string;
  amount: string;
  purpose?: string;
}

export interface PaymentResult {
  txHash: string;
  popToken: string;
  amount: string;
  recipient: string;
  timestamp: number;
}

export interface PoPTokenPayload {
  sub: string;
  aud: string;
  amount: string;
  txHash: string;
  purpose?: string;
  exp: number;
}

export interface x402PaymentRequiredResponse {
  error: string;
  amount: string;
  recipient: string;
  currency: string;
  network: string;
  purpose?: string;
}

export interface GateOptions {
  amount: string;
  recipient: string;
  purpose: string;
  backendUrl?: string;
  secretKey?: string;
}
