import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const wallet = ethers.Wallet.createRandom();
  console.log("==================================================");
  console.log("🎉 NEW BASE SEPOLIA DEPLOYER WALLET GENERATED!");
  console.log("==================================================");
  console.log("Address:    ", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("==================================================");

  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, "utf8");
    content = content.replace(/PRIVATE_KEY=.*/g, `PRIVATE_KEY=${wallet.privateKey}`);
    fs.writeFileSync(envPath, content);
    console.log("✅ Saved Private Key to .env");
  } else {
    fs.writeFileSync(envPath, `PRIVATE_KEY=${wallet.privateKey}\nBASE_SEPOLIA_RPC_URL=https://sepolia.base.org\n`);
    console.log("✅ Created .env with Private Key");
  }
}

main().catch(console.error);
