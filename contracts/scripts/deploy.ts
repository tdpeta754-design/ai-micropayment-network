import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment on network:", network.name);
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // 1. Deploy MockUSDC
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed at:", mockUSDCAddress);

  // 2. Mint USDC to deployer
  const MINT_AMOUNT = ethers.parseUnits("1000000", 6);
  console.log(`Minting ${ethers.formatUnits(MINT_AMOUNT, 6)} USDC to deployer...`);
  const mintTx = await mockUSDC.mint(deployer.address, MINT_AMOUNT);
  await mintTx.wait();

  // 3. Deploy WalletFactory
  console.log("Deploying WalletFactory...");
  const WalletFactory = await ethers.getContractFactory("WalletFactory");
  const walletFactory = await WalletFactory.deploy();
  await walletFactory.waitForDeployment();
  const walletFactoryAddress = await walletFactory.getAddress();
  console.log("WalletFactory deployed at:", walletFactoryAddress);

  // 4. Deploy PaymentRouter
  console.log("Deploying PaymentRouter...");
  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  const paymentRouter = await PaymentRouter.deploy(mockUSDCAddress, deployer.address);
  await paymentRouter.waitForDeployment();
  const paymentRouterAddress = await paymentRouter.getAddress();
  console.log("PaymentRouter deployed at:", paymentRouterAddress);

  // 5. Deploy Paymaster
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  console.log("Deploying Paymaster...");
  const Paymaster = await ethers.getContractFactory("Paymaster");
  const initialRate = 3500_000000n; // $3500/ETH with 6 decimals
  const paymaster = await Paymaster.deploy(ENTRY_POINT, mockUSDCAddress, initialRate);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("Paymaster deployed at:", paymasterAddress);

  // 6. Exchange rate already set in constructor
  console.log("Paymaster exchange rate set to $3500/ETH");

  // 7. Create 2 demo wallets
  console.log("Creating demo wallets...");
  const agentASalt = 1;
  const agentBSalt = 2;
  
  const createATx = await walletFactory.createWallet(deployer.address, agentASalt, ENTRY_POINT);
  await createATx.wait();
  const agentAAddress = await walletFactory.getWalletAddress(deployer.address, agentASalt, ENTRY_POINT);
  console.log("Agent A Wallet created at:", agentAAddress);

  const createBTx = await walletFactory.createWallet(deployer.address, agentBSalt, ENTRY_POINT);
  await createBTx.wait();
  const agentBAddress = await walletFactory.getWalletAddress(deployer.address, agentBSalt, ENTRY_POINT);
  console.log("Agent B Wallet created at:", agentBAddress);

  // 8. Mint 1000 USDC to each demo wallet
  console.log("Minting USDC to demo wallets...");
  const DEMO_AMOUNT = ethers.parseUnits("1000", 6);
  await (await mockUSDC.mint(agentAAddress, DEMO_AMOUNT)).wait();
  await (await mockUSDC.mint(agentBAddress, DEMO_AMOUNT)).wait();

  // 9. Log and 10. Save
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployer: deployer.address,
    contracts: {
      mockUSDC: mockUSDCAddress,
      walletFactory: walletFactoryAddress,
      paymentRouter: paymentRouterAddress,
      paymaster: paymasterAddress
    },
    demoWallets: {
      agentA: agentAAddress,
      agentB: agentBAddress
    },
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, "base-sepolia.json");
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", filePath);
  
  console.log("\nDeployment Successful! 🎉");
  console.log(deploymentInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
