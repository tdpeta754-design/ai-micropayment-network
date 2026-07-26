const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 Khởi chạy toàn bộ Hệ thống AI Micropayment Network');
console.log('====================================================\n');

// 1. Khởi chạy Backend Indexer & WebSocket Hub (Port 3001)
console.log('🟢 [1/3] Khởi chạy Backend Indexer & Token Issuer (Port 3001)...');
const backend = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 2. Khởi chạy AI Provider Agent B (Port 3002)
console.log('🟣 [2/3] Khởi chạy AI Provider Gate Agent B (Port 3002)...');
const provider = spawn('node', ['agent-provider.js'], {
  cwd: path.join(__dirname, 'demo'),
  stdio: 'inherit',
  shell: true
});

// 3. Khởi chạy Next.js Web3 Dashboard (Port 3000)
console.log('🔵 [3/3] Khởi chạy Web3 Dashboard Next.js (Port 3000)...');
const dashboard = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: path.join(__dirname, 'dashboard'),
  stdio: 'inherit',
  shell: true
});

console.log('\n✨ Hệ thống đang khởi động! Bạn vui lòng đợi 3-5 giây sau đó truy cập:');
console.log('👉 Web3 Dashboard: http://localhost:3000');
console.log('👉 Backend Indexer: http://localhost:3001/api/health\n');

// Quản lý tắt sạch tiến trình khi dừng
process.on('SIGINT', () => {
  console.log('\n🛑 Đang dừng toàn bộ máy chủ...');
  backend.kill();
  provider.kill();
  dashboard.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  backend.kill();
  provider.kill();
  dashboard.kill();
  process.exit(0);
});
