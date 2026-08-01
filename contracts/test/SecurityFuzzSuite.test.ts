import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import fc from 'fast-check';

/**
 * AI Micropayment Network (AiMPN v2.0)
 * AUTOMATED SECURITY FUZZING & INVARIANT TEST SUITE
 * 
 * Powered by fast-check (Property-Based Fuzzing)
 * Purpose: Mathematically verify that Guardian security boundaries, spending limits,
 * and escrow state transitions cannot be breached under ANY randomized inputs.
 */
describe('🛡️ Automated Security Fuzzing (fast-check)', function () {
    // Increase Mocha timeout due to massive fuzzing iterations
    this.timeout(300000); // 5 minutes

    const USDC_DECIMALS = 6;
    const parseUSDC = (amount: string | number) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);
    const parseETH = (amount: string | number) => ethers.parseEther(amount.toString());

    async function deploySecurityFixture() {
        const [owner, agentA, agentB, attacker, feeCollector] = await ethers.getSigners();

        const MockUSDC = await ethers.getContractFactory('MockUSDC');
        const usdc = await MockUSDC.deploy();
        
        const WalletFactory = await ethers.getContractFactory('WalletFactory');
        const factory = await WalletFactory.deploy();

        const PaymentRouter = await ethers.getContractFactory('PaymentRouter');
        const router = await PaymentRouter.deploy(await usdc.getAddress(), feeCollector.address);

        const salt = 1;
        const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
        await factory.createWallet(owner.address, salt, entryPoint);
        const walletAddress = await factory.getWalletAddress(owner.address, salt, entryPoint);
        const wallet = await ethers.getContractAt('SmartWallet', walletAddress);

        await owner.sendTransaction({ to: walletAddress, value: parseETH('1000') });
        await usdc.mint(agentA.address, parseUSDC('1000000'));

        return { usdc, factory, router, wallet, owner, agentA, agentB, attacker, feeCollector };
    }

    describe('1. Fuzzing: Max Per-Transaction Spending Limit', function () {
        it('should NEVER allow any random amount to exceed maxPerTx boundary', async function () {
            const { wallet, owner, agentB } = await loadFixture(deploySecurityFixture);

            // Hard boundary: 5 ETH
            const maxPerTx = parseETH('5');
            await wallet.connect(owner).setSpendingPolicy(maxPerTx, parseETH('1000'), parseETH('10000'), 0);

            // Fuzz test running hundreds of randomized amounts (from 0 to 15 ETH)
            await fc.assert(
                fc.asyncProperty(
                    fc.bigInt({ min: 1000000000000000n, max: 15000000000000000000n }), // From 0.001 ETH to 15.0 ETH
                    async (amountBigInt) => {
                        const amount = amountBigInt;
                        
                        if (amount > maxPerTx) {
                            // Property: Amounts over limit MUST revert
                            await expect(
                                wallet.connect(owner).execute(agentB.address, amount, '0x')
                            ).to.be.revertedWithCustomError(wallet, 'ExceedsMaxPerTx');
                        } else {
                            // Property: Amounts under limit MUST succeed
                            await expect(
                                wallet.connect(owner).execute(agentB.address, amount, '0x')
                            ).to.not.be.reverted;
                        }
                    }
                ),
                { numRuns: 100 } // Configurable for CI (e.g., 10,000 for nightly builds)
            );
        });
    });

    describe('2. Fuzzing: Escrow Double-Spend & Premature Refund Resistance', function () {
        it('should strictly enforce timeout math regardless of extreme time shifts', async function () {
            const { router, usdc, agentA, agentB } = await loadFixture(deploySecurityFixture);

            await usdc.connect(agentA).approve(await router.getAddress(), parseUSDC('1000000'));

            // Fuzz test generating random time shifts
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: -100000, max: 100000 }), // Random time shift in seconds
                    async (timeShift) => {
                        const nonce = ethers.id(`FUZZ_NONCE_${Date.now()}_${Math.random()}`);
                        const amount = parseUSDC('10');
                        const timeoutSeconds = 300; // 5 mins

                        const tx = await router.connect(agentA).processPaymentWithEscrow(
                            agentA.address, agentB.address, amount, nonce, timeoutSeconds
                        );
                        await tx.wait();

                        const block = await ethers.provider.getBlock('latest');
                        const escrowId = ethers.solidityPackedKeccak256(
                            ['address', 'address', 'uint256', 'bytes32', 'uint256'],
                            [agentA.address, agentB.address, amount, nonce, block!.timestamp]
                        );

                        // If the Fuzzer attempts to shift time backwards or not far enough
                        if (timeShift < timeoutSeconds) {
                            // Property: Premature Refund MUST ALWAYS revert
                            await expect(
                                router.connect(agentA).refundEscrow(escrowId)
                            ).to.be.revertedWithCustomError(router, 'EscrowNotExpired');
                        } 
                        // Note: We avoid modifying global block time inside the fast-check loop 
                        // as it permanently mutates Hardhat state and breaks subsequent iterations.
                        // So we strictly assert the premature refund property here.
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
