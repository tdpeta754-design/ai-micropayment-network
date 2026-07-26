const { fork } = require('child_process');
const path = require('path');
const { runConsumer } = require('./agent-consumer');

async function runDemo() {
  console.log('🌟 Starting AI M2M Micropayment Demo 🌟\n');

  console.log('🔄 Starting Payment Backend (Port 3001)...');
  const backendProcess = fork(path.join(__dirname, '../backend/src/server.js'), [], { stdio: 'inherit' });

  console.log('🔄 Starting AI Provider (Port 3002)...');
  const providerProcess = fork(path.join(__dirname, 'agent-provider.js'), [], { stdio: 'inherit' });

  // Wait for servers to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n======================================');
  console.log('🏃‍♂️ Running Consumer AI Agent');
  console.log('======================================\n');
  
  try {
    await runConsumer();
  } catch (e) {
    console.error('Demo consumer error:', e);
  }

  console.log('\n======================================');
  console.log('🏁 Demo Complete!');
  console.log('======================================\n');

  backendProcess.kill('SIGTERM');
  providerProcess.kill('SIGTERM');
  setTimeout(() => {
    process.exit(0);
  }, 300);
}

runDemo().catch(console.error);
