const { PaymentClient } = require('@antigravity/sdk');

async function runConsumer() {
  console.log('🚀 [Agent A - Consumer] Initializing...');

  const client = new PaymentClient({
    walletAddress: '0xA100000000000000000000000000000000000001',
    privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    backendUrl: 'http://localhost:3001'
  });

  console.log('📡 [Agent A - Consumer] Making HTTP Request to Market Intelligence API...');
  
  try {
    const response = await client.fetchWithPay('http://localhost:3002/api/market-intelligence');
    const data = await response.json();
    console.log('\n✅ [Agent A - Consumer] Success! Data received:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ [Agent A - Consumer] Error fetching data:', error.message);
  }
}

if (require.main === module) {
  runConsumer();
}

module.exports = { runConsumer };
