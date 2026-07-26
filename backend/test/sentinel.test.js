const request = require('supertest');
const { app } = require('../src/server');
const sentinel = require('../src/services/aiSentinel');

describe('AI Sentinel Security Warden API Tests', () => {
    beforeEach(() => {
        sentinel.startMonitoring();
        sentinel.circuitBreakersTripped.clear();
        sentinel.activeThreats.clear();
        sentinel.threatLogs = [];
    });

    test('GET /api/sentinel/status should return active status and rules', async () => {
        const res = await request(app).get('/api/sentinel/status');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toEqual('ACTIVE_24_7');
        expect(res.body.data.rules).toHaveLength(2);
    });

    test('POST /api/sentinel/simulate-attack with PRICE_SPIKE_ANOMALY should trigger instant circuit breaker', async () => {
        const res = await request(app)
            .post('/api/sentinel/simulate-attack')
            .send({ attackType: 'PRICE_SPIKE_ANOMALY' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.result.tripped).toBe(true);
        expect(res.body.result.threatType).toEqual('PRICE_SPIKE_ANOMALY');
        expect(sentinel.circuitBreakersTripped.size).toBe(1);
    });

    test('POST /api/sentinel/simulate-attack with RAPID_LOOP_HALLUCINATION should block loop after 5 failures', async () => {
        const res = await request(app)
            .post('/api/sentinel/simulate-attack')
            .send({ attackType: 'RAPID_LOOP_HALLUCINATION' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.result.tripped).toBe(true);
        expect(res.body.result.threatType).toEqual('RAPID_LOOP_HALLUCINATION');
        expect(sentinel.threatLogs).toHaveLength(1);
    });

    test('POST /api/sentinel/reset should clear tripped circuit breakers', async () => {
        await request(app).post('/api/sentinel/simulate-attack').send({ attackType: 'PRICE_SPIKE_ANOMALY' });
        expect(sentinel.circuitBreakersTripped.size).toBe(1);

        const res = await request(app).post('/api/sentinel/reset').send({});
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(sentinel.circuitBreakersTripped.size).toBe(0);
    });
});
