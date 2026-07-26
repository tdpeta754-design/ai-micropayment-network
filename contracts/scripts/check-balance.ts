import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balanceWei = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balanceWei);
  const network = await ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("🌐 Network:    ", network.name, `(Chain ID: ${network.chainId})`);
  console.log("👤 Address:    ", deployer.address);
  console.log("💰 Balance:    ", balanceEth, "ETH");
  console.log("==================================================");

  if (balanceWei === 0n) {
    console.log("⚠️  Ví chưa có ETH! Bạn vui lòng xin ETH testnet tại các Faucet:");
    console.log("👉 1. Superchain Faucet: https://app.optimism.io/faucet");
    console.log("👉 2. QuickNode Faucet:  https://faucet.quicknode.com/base/sepolia");
    console.log("👉 3. Alchemy Faucet:    https://www.alchemy.com/faucets/base-sepolia");
    console.log("👉 4. Ethereum Ecosystem: https://www.infura.io/faucet/base-sepolia");
    console.log("==================================================");
  } else {
    console.log("✅ Ví đã sẵn sàng để Deploy! Chạy lệnh:");
    console.log("   npx hardhat run scripts/deploy.ts --network base-sepolia");
  }
}

main().catch(console.error);
