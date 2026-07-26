import { PaymentClient } from '../src/PaymentClient';
import { PaymentGate } from '../src/PaymentGate';
import { ethers } from 'ethers';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Simple mock for fetch
global.fetch = jest.fn() as jest.Mock;

describe('SDK Tests', () => {
    let client: PaymentClient;
    let mockSigner: any;

    beforeEach(() => {
        mockSigner = {
            getAddress: jest.fn().mockResolvedValue('0xUserAddress'),
        };

        client = new PaymentClient({
            signer: mockSigner as any,
            routerAddress: '0xRouter',
            usdcAddress: '0xUSDC',
            backendUrl: 'http://localhost:3001'
        });

        // Mock ethers contract
        jest.spyOn(ethers, 'Contract').mockImplementation(() => {
            return {
                allowance: jest.fn().mockResolvedValue(ethers.parseUnits('100', 6)),
                processPayment: jest.fn().mockResolvedValue({
                    hash: '0xHash',
                    wait: jest.fn().mockResolvedValue(true)
                })
            } as any;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('PaymentClient pay method should succeed', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { popToken: 'mock-pop-token' }
        });

        const result = await client.pay('0xRecipient', '1.0');
        expect(result.txHash).toBe('0xHash');
        expect(result.popToken).toBe('mock-pop-token');
    });

    test('PaymentGate middleware should return 402 if no token', async () => {
        const middleware = PaymentGate.requirePayment({
            amount: '1.0',
            recipient: '0xRecipient',
            purpose: 'AI Service'
        });

        const req = { headers: {} };
        const res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Payment Required' }));
    });

    test('PaymentGate middleware should call next if valid token', async () => {
        const middleware = PaymentGate.requirePayment({
            amount: '1.0',
            recipient: '0xRecipient',
            purpose: 'AI Service'
        });

        const req = { headers: { authorization: 'Bearer valid-token' }, paymentProof: null };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                valid: true,
                payload: { aud: '0xRecipient', amount: '1.0' }
            }
        });

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.paymentProof).toBeDefined();
    });
});
