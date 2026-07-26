const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordDemoVideo() {
  console.log('====================================================================');
  console.log('🎬 BẮT ĐẦU TỰ ĐỘNG QUAY VIDEO DEMO AIMPN V2.0 CHO BASE GRANTS 🎬');
  console.log('====================================================================\n');

  const videoDir = path.join(__dirname, '../demo-video');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  let browser;
  try {
    console.log('🔵 [1/7] Khởi chạy trình duyệt Google Chrome (Chế độ hiển thị trực quan)...');
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 300 // Làm chậm 300ms giữa các thao tác để giống người dùng thật và mượt mà
    });
  } catch (e) {
    console.log('⚠️ Không tìm thấy Google Chrome, chuyển sang Microsoft Edge...');
    browser = await chromium.launch({
      channel: 'msedge',
      headless: false,
      slowMo: 300
    });
  }

  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('🔵 [2/7] Truy cập Web3 Control Plane Dashboard (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Đợi 3 giây để màn hình load hoàn chỉnh

    console.log('🔵 [3/7] Cuộn xuống xem danh mục AI Service Marketplace...');
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    console.log('🔵 [4/7] Bấm mua dịch vụ tự động "Trigger x402 Buy" (Agent B - Market Intelligence)...');
    const buyButtons = page.locator('button', { hasText: 'Trigger x402 Buy' });
    await buyButtons.first().click();

    console.log('⏳ Đang theo dõi tiến trình 5 bước x402 Auto-Payment Engine (Đợi 6 giây)...');
    await page.waitForTimeout(6500); // Đợi tiến trình 5 bước hoàn tất và hiện bảng xanh

    console.log('🔵 [5/7] Di chuyển xuống bộ điều khiển Guardian Spending Policy...');
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    console.log('🚨 Bấm thử nghiệm mô phỏng tấn công Lính gác AI Sentinel...');
    const sentinelBtn = page.locator('button', { hasText: 'Trigger AI Sentinel Attack Simulation' });
    await sentinelBtn.click();
    await page.waitForTimeout(2000);

    console.log('⬆️ Cuộn lên trên để quan sát cảnh báo đỏ và giao dịch bị ngắt mạch...');
    await page.evaluate(() => window.scrollTo({ top: 150, behavior: 'smooth' }));
    await page.waitForTimeout(4000);

    console.log('🔵 [6/7] Cuộn xuống kiểm thử tính năng đóng băng ví khẩn cấp (Freeze Wallets)...');
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    const freezeBtn = page.locator('button', { hasText: 'Freeze Wallets' });
    await freezeBtn.click();
    console.log('❄️ Đã khóa đóng băng ví thành công!');
    await page.waitForTimeout(2000);

    console.log('⚡ Cuộn lên thử gọi dịch vụ AI (GPU Tensor Core) khi ví đang bị khóa...');
    await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    await buyButtons.nth(2).click(); // Click nút thứ 3 (GPU Tensor Core)
    console.log('🚨 Đã kích hoạt lệnh từ chối giao dịch từ Smart Contract!');
    await page.waitForTimeout(2000);

    console.log('⬆️ Cuộn lên hiển thị bảng lỗi từ chối giao dịch (Guardian Enforcer REJECTED)...');
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
    await page.waitForTimeout(3500);

    console.log('🔵 [7/7] Mở khóa lại ví và quay về trang chủ kết thúc Demo...');
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    const unfreezeBtn = page.locator('button', { hasText: 'FROZEN' });
    await unfreezeBtn.click();
    await page.waitForTimeout(2000);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(3000); // Cảnh quay kết thúc hoàn hảo

  } catch (error) {
    console.error('❌ Lỗi trong quá trình quay video:', error);
  } finally {
    console.log('🏁 Đang đóng trình duyệt và lưu tệp video...');
    await context.close();
    await browser.close();

    // Tìm file video vừa tạo và đổi tên thành chuẩn đẹp
    const files = fs.readdirSync(videoDir);
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
      const oldPath = path.join(videoDir, webmFile);
      const newPath = path.join(videoDir, 'AiMPN_v2_Base_Grants_Demo.webm');
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      fs.renameSync(oldPath, newPath);
      console.log('\n====================================================================');
      console.log('🎉 HOÀN TẤT! VIDEO DEMO ĐÃ ĐƯỢC QUAY VÀ LƯU THÀNH CÔNG TẠI:');
      console.log(`👉 ${newPath}`);
      console.log('====================================================================\n');
    } else {
      console.log('⚠️ Không tìm thấy file video trong thư mục.');
    }
  }
}

if (require.main === module) {
  recordDemoVideo().catch(console.error);
}

module.exports = { recordDemoVideo };
