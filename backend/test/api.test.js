const request = require('supertest');
const { app, server } = require('../src/server');
const db = require('../src/db/db');

// Mock blockchain service
jest.mock('../src/services/blockchain', () => {
    return {
        addresses: {
            mockUSDC: '0x123',
            walletFactory: '0x456',
            paymentRouter: '0x789',
            paymaster: '0xabc'
        },
        predictWalletAddress: jest.fn().mockResolvedValue('0xPredictedWalletAddress'),
        getEthBalance: jest.fn().mockResolvedValue('1.5'),
        getUsdcBalance: jest.fn().mockResolvedValue('100.0'),
        verifyTransaction: jest.fn().mockImplementation((txHash) => {
            if (txHash === '0xValidTx') {
                return Promise.resolve({
                    valid: true,
                    from: '0xFrom',
                    to: '0xTo',
                    amount: '10.0',
                    purpose: 'Test payment'
                });
            }
            return Promise.resolve({ valid: false, error: 'Invalid tx' });
        }),
        paymentRouterContract: {
            on: jest.fn()
        },
        provider: {
            on: jest.fn()
        }
    };
});

describe('API Tests', () => {
    afterAll((done) => {
        if (server.listening) {
            server.close(() => {
                db.exec("DELETE FROM wallets; DELETE FROM session_keys; DELETE FROM transactions; DELETE FROM payment_proofs;");
                done();
            });
        } else {
            db.exec("DELETE FROM wallets; DELETE FROM session_keys; DELETE FROM transactions; DELETE FROM payment_proofs;");
            done();
        }
    });

    it('GET /api/health should return ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
        expect(res.body.network).toEqual('base-sepolia');
    });

    it('POST /api/wallets/predict should predict address and save to DB', async () => {
        const res = await request(app)
            .post('/api/wallets/predict')
            .send({ owner: '0xOwner', salt: 123 });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.address).toEqual('0xPredictedWalletAddress');
        expect(res.body.owner).toEqual('0xOwner');
        expect(res.body.salt).toEqual(123);
    });

    it('POST /api/wallets/:address/session-keys should register a session key', async () => {
        const res = await request(app)
            .post('/api/wallets/0xPredictedWalletAddress/session-keys')
            .send({
                key_address: '0xSessionKey',
                valid_after: 1000,
                valid_until: 2000,
                spend_limit: '10'
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body.id).toBeDefined();
    });

    it('GET /api/transactions should return paginated transactions', async () => {
        const res = await request(app).get('/api/transactions');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it('POST /api/payments/verify should verify valid transaction and return JWT', async () => {
        const res = await request(app)
            .post('/api/payments/verify')
            .send({ txHash: '0xValidTx', purpose: 'Test payment' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body.popToken).toBeDefined();
        expect(res.body.details.amount).toEqual('10.0');
    });
});
