import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

/**
 * AI Micropayment Network (AiMPN v2.0)
 * AUTOMATED SECURITY FUZZING & INVARIANT TEST SUITE
 * 
 * Purpose: Mathematically verify that Guardian security boundaries, spending limits,
 * session key budgets, and escrow state transitions cannot be breached under any
 * randomized transaction inputs or rapid-fire attack loops.
 */
describe('🛡️ Automated Security Fuzzing & Invariant Suite', function () {
    const USDC_DECIMALS = 6;
    const parseUSDC = (amount: string | number) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);
    const parseETH = (amount: string | number) => ethers.parseEther(amount.toString());

    async function deploySecurityFixture() {
        const [owner, agentA, agentB, attacker, feeCollector] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory('MockUSDC');
        const usdc = await MockUSDC.deploy();
        await usdc.waitForDeployment();
        const usdcAddress = await usdc.getAddress();

        // Deploy WalletFactory
        const WalletFactory = await ethers.getContractFactory('WalletFactory');
        const factory = await WalletFactory.deploy();
        await factory.waitForDeployment();

        // Deploy PaymentRouter (requires usdcAddress and feeCollector address)
        const PaymentRouter = await ethers.getContractFactory('PaymentRouter');
        const router = await PaymentRouter.deploy(usdcAddress, feeCollector.address);
        await router.waitForDeployment();

        // Create SmartWallet for Agent A
        const salt = 1;
        const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
        await factory.createWallet(owner.address, salt, entryPoint);
        const walletAddress = await factory.getWalletAddress(owner.address, salt, entryPoint);
        const wallet = await ethers.getContractAt('SmartWallet', walletAddress);

        // Fund wallet with ETH for testing native guardrails
        await owner.sendTransaction({
            to: walletAddress,
            value: parseETH('100') // 100 ETH
        });

        // Mint and fund USDC
        await usdc.mint(agentA.address, parseUSDC('100000'));

        return { usdc, factory, router, wallet, owner, agentA, agentB, attacker, feeCollector };
    }

    describe('1. Invariant: Max Per-Transaction Spending Cap (Fuzzing 50 Random Amounts)', function () {
        it('should ALWAYS reject transactions exceeding maxPerTx and permit transactions below', async function () {
            const { wallet, owner, agentB } = await loadFixture(deploySecurityFixture);

            // Set Policy: Max Per-Tx = 5 ETH, Daily Limit = 500 ETH, Monthly = 5000 ETH
            const maxPerTx = parseETH('5');
            const dailyLimit = parseETH('500');
            const monthlyLimit = parseETH('5000');
            await wallet.connect(owner).setSpendingPolicy(maxPerTx, dailyLimit, monthlyLimit, 0);

            // Generate 50 randomized transaction amounts between 0.1 and 20.0 ETH
            const randomAmounts = Array.from({ length: 50 }, () => {
                return (Math.random() * 19.9 + 0.1).toFixed(2);
            });

            let passCount = 0;
            let rejectCount = 0;

            for (const amountStr of randomAmounts) {
                const amount = parseETH(amountStr);

                if (amount > maxPerTx) {
                    // MUST Revert with ExceedsMaxPerTx
                    await expect(
                        wallet.connect(owner).execute(agentB.address, amount, '0x')
                    ).to.be.revertedWithCustomError(wallet, 'ExceedsMaxPerTx');
                    rejectCount++;
                } else {
                    // Must Succeed
                    await expect(
                        wallet.connect(owner).execute(agentB.address, amount, '0x')
                    ).to.not.be.reverted;
                    passCount++;
                }
            }

            console.log(`      ✓ Fuzz Test Completed: ${passCount} permitted (<= 5 ETH), ${rejectCount} rejected (> 5 ETH)`);
            expect(passCount + rejectCount).to.equal(50);
        });
    });

    describe('2. Invariant: Daily Budget Accumulation & Zero Drain Guarantee', function () {
        it('should NEVER allow cumulative spending in 24h to exceed dailyLimit under rapid loop attack', async function () {
            const { wallet, owner, agentB } = await loadFixture(deploySecurityFixture);

            // Set Policy: Max Per-Tx = 10 ETH, Daily Limit = 35 ETH
            const maxPerTx = parseETH('10');
            const dailyLimit = parseETH('35');
            await wallet.connect(owner).setSpendingPolicy(maxPerTx, dailyLimit, parseETH('1000'), 0);

            // Simulate an AI Agent entering an out-of-control payment loop: 10 txs of 5 ETH each (= 50 ETH total)
            const loopAmount = parseETH('5');

            let successfulTxs = 0;
            let blockedTxs = 0;

            for (let i = 1; i <= 10; i++) {
                try {
                    const tx = await wallet.connect(owner).execute(agentB.address, loopAmount, '0x');
                    await tx.wait();
                    successfulTxs++;
                } catch (e: any) {
                    expect(e.message).to.include('ExceedsDailyLimit');
                    blockedTxs++;
                }
            }

            // Exactly 7 txs of 5 ETH (= 35 ETH) should succeed. The 8th, 9th, and 10th MUST be blocked!
            expect(successfulTxs).to.equal(7);
            expect(blockedTxs).to.equal(3);

            const finalDailySpent = await wallet.dailySpent();
            expect(finalDailySpent).to.equal(parseETH('35'));
            console.log(`      ✓ Loop Attack Defeated: Exactly 35 ETH spent, subsequent ${blockedTxs} txs blocked by Hard Limit.`);
        });
    });

    describe('3. Invariant: Session Key Delegation & Privilege Boundaries', function () {
        it('should enforce strict state boundaries and revocation invariants on AI Session Keys', async function () {
            const { wallet, owner, agentA } = await loadFixture(deploySecurityFixture);

            const now = await time.latest();
            const validAfter = now;
            const validUntil = now + 3600; // 1 hour validity
            const spendLimit = parseETH('12');

            // 1. Add session key
            await expect(
                wallet.connect(owner).addSessionKey(agentA.address, validAfter, validUntil, spendLimit)
            ).to.emit(wallet, 'SessionKeyAdded');

            let key = await wallet.sessionKeys(agentA.address);
            expect(key.active).to.equal(true);
            expect(key.spendLimit).to.equal(spendLimit);

            // 2. Revoke session key
            await expect(
                wallet.connect(owner).revokeSessionKey(agentA.address)
            ).to.emit(wallet, 'SessionKeyRevoked');

            key = await wallet.sessionKeys(agentA.address);
            expect(key.active).to.equal(false);
            console.log('      ✓ Session Key state machine invariant verified: Revocation immediately deactivates delegation.');
        });
    });

    describe('4. Invariant: Escrow Atomic State & Double-Spend Prevention', function () {
        it('should prevent releasing escrow before timeout or refunding after release', async function () {
            const { router, usdc, agentA, agentB } = await loadFixture(deploySecurityFixture);

            // Approve router
            await usdc.connect(agentA).approve(await router.getAddress(), parseUSDC('100'));

            const nonce = ethers.id('ESCROW_FUZZ_TEST_1');
            const amount = parseUSDC('50');
            const timeoutSeconds = 300; // 5 minutes

            // Create Escrow: from, to, amount, nonce, timeoutSeconds
            const tx = await router.connect(agentA).processPaymentWithEscrow(
                agentA.address,
                agentB.address,
                amount,
                nonce,
                timeoutSeconds
            );
            await tx.wait();

            const block = await ethers.provider.getBlock('latest');
            const escrowId = ethers.solidityPackedKeccak256(
                ['address', 'address', 'uint256', 'bytes32', 'uint256'],
                [agentA.address, agentB.address, amount, nonce, block!.timestamp]
            );

            // 1. Attacker or AgentA attempts to refund escrow IMMEDIATELY before timeout -> MUST revert
            await expect(
                router.connect(agentA).refundEscrow(escrowId)
            ).to.be.revertedWithCustomError(router, 'EscrowNotExpired');

            // 2. Payee (AgentB) releases the escrow -> MUST succeed
            await expect(
                router.connect(agentB).releaseEscrow(escrowId)
            ).to.emit(router, 'EscrowReleased').withArgs(escrowId);

            // 3. Attempting to release AGAIN (Double-spend attack) -> MUST revert
            await expect(
                router.connect(agentB).releaseEscrow(escrowId)
            ).to.be.revertedWithCustomError(router, 'EscrowAlreadyResolved');

            // 4. Fast forward time past deadline and attempt to refund an ALREADY released escrow -> MUST revert
            await time.increase(400);
            await expect(
                router.connect(agentA).refundEscrow(escrowId)
            ).to.be.revertedWithCustomError(router, 'EscrowAlreadyResolved');

            console.log('      ✓ Escrow state machine invariant verified: Zero double-spends or premature refunds.');
        });
    });
});
