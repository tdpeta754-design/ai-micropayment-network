const express = require('express');
const cors = require('cors');
const { requirePayment } = require('@antigravity/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Apply requirePayment middleware for market intelligence
app.use('/api/market-intelligence', requirePayment({
  amount: '0.05',
  recipient: '0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E',
  purpose: 'AI Market Intelligence Data',
  verificationUrl: 'http://localhost:3001/api/payments/validate-token'
}));

app.get('/api/market-intelligence', (req, res) => {
  res.json({
    status: 'success',
    data: {
      sentiment: 'bullish',
      btcPricePrediction: '68000',
      ethPricePrediction: '3500',
      confidenceScore: 0.92,
      recommendation: 'STRONG_BUY',
      timestamp: new Date().toISOString()
    }
  });
});

// Apply requirePayment middleware for weather
app.use('/api/weather', requirePayment({
  amount: '0.01',
  recipient: '0x70F70567Ca2bfe6bD62d5bE38D09a04Ba16D575E',
  purpose: 'AI Weather Forecast Data',
  verificationUrl: 'http://localhost:3001/api/payments/validate-token'
}));

app.get('/api/weather', (req, res) => {
  res.json({
    status: 'success',
    data: {
      location: 'San Francisco',
      temperature: '65F',
      forecast: 'Sunny',
      timestamp: new Date().toISOString()
    }
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`[Agent B - Provider] 🤖 API listening on port ${PORT}`);
});
