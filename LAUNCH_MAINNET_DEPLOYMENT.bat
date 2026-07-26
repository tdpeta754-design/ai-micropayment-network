@echo off
chcp 65001 > nul
cls
echo ====================================================================
echo 🚀 AIMPN V2.0 — CỖ MÁY BẤM NÚT TRIỂN KHAI BASE MAINNET 🚀
echo ====================================================================
echo.
echo Chào Solo Founder! Kịch bản này sẽ tự động hóa trọn gói quá trình
echo đưa hệ thống AI Micropayment Network lên mạng Base Mainnet toàn cầu.
echo.
echo ⚠️  LƯU Ý BẢO MẬT: Private Key của bạn chỉ lưu cục bộ trên máy này
echo    tại file contracts\.env và không bao giờ bị lộ hay gửi đi đâu khác.
echo.
set /p pk="👉 Hãy dán Private Key ví MetaMask (có ~0.06 ETH mạng Base) vào đây rồi nhấn Enter: "
if "%pk%"=="" (
    echo ❌ Lỗi: Bạn chưa nhập Private Key. Đang hủy thao tác...
    pause
    exit /b 1
)

echo.
echo ⏳ Đang thiết lập cấu hình an toàn tại contracts\.env...
(
echo PRIVATE_KEY=%pk%
echo BASE_MAINNET_RPC_URL=https://mainnet.base.org
) > contracts\.env

echo 📦 Đang kết nối vào thư mục contracts...
cd contracts
call npm install --silent

echo.
echo ====================================================================
echo 🚀 BẮT ĐẦU PHÁT HÀNH SMART CONTRACT LÊN CHUỖI BASE MAINNET...
echo ====================================================================
call npx hardhat run scripts/deploy-base-mainnet.ts --network base-mainnet

if %errorlevel% neq 0 (
    echo.
    echo ❌ TRIỂN KHAI THẤT BẠI! Vui lòng kiểm tra lại số dư ETH trong ví (cần tối thiểu ~0.005 ETH).
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo 🎉 CHÚC MỪNG! HỆ THỐNG ĐÃ CHÍNH THỨC CÓ MẶT TRÊN BASE MAINNET!
echo ====================================================================
echo 📋 Các địa chỉ hợp đồng thật đã được lưu tự động tại: contracts\deployments\base-mainnet.json
echo.
echo 👉 Bạn có thể mở BaseScan (https://basescan.org) để kiểm chứng ngay các hợp đồng vừa tạo!
echo.
pause
