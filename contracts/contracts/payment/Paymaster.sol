// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {UserOperation} from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IPaymaster} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";

/**
 * @title Paymaster
 * @author Antigravity Team
 * @dev ERC-4337 Verifying Paymaster that sponsors gas for AI agent wallets.
 *      Charges the wallet in USDC for gas consumed after execution.
 */
contract Paymaster is BasePaymaster {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public ethToUsdcRate; // e.g., 3500_000000 ($3500 with 6 decimals)
    mapping(address => bool) public supportedWallets;

    // ============ Custom Errors ============
    error UnsupportedWallet();
    error InvalidRate();

    // ============ Events ============
    event WalletSupported(address indexed wallet, bool supported);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event GasChargeFailed(address indexed wallet, uint256 amount);
    event GasCharged(address indexed wallet, uint256 amount);

    /**
     * @notice Initialize the Paymaster
     * @param _entryPoint The ERC-4337 EntryPoint contract
     * @param _usdc The USDC token contract address
     * @param _ethToUsdcRate Initial ETH to USDC rate (6 decimals, e.g., 3500_000000)
     */
    constructor(
        IEntryPoint _entryPoint,
        address _usdc,
        uint256 _ethToUsdcRate
    ) BasePaymaster(_entryPoint) {
        usdc = IERC20(_usdc);
        ethToUsdcRate = _ethToUsdcRate;
    }

    // ============ Management Functions ============

    /**
     * @notice Register a wallet for gas sponsorship
     * @param wallet The SmartWallet address to support
     */
    function addSupportedWallet(address wallet) external onlyOwner {
        supportedWallets[wallet] = true;
        emit WalletSupported(wallet, true);
    }

    /**
     * @notice Remove a wallet from gas sponsorship
     * @param wallet The SmartWallet address to remove
     */
    function removeSupportedWallet(address wallet) external onlyOwner {
        supportedWallets[wallet] = false;
        emit WalletSupported(wallet, false);
    }

    /**
     * @notice Update the ETH to USDC exchange rate
     * @param rate New rate (e.g., 3500 * 1e6 for $3500/ETH)
     */
    function setExchangeRate(uint256 rate) external onlyOwner {
        if (rate == 0) revert InvalidRate();
        uint256 oldRate = ethToUsdcRate;
        ethToUsdcRate = rate;
        emit ExchangeRateUpdated(oldRate, rate);
    }

    /**
     * @notice Check if a wallet is supported
     * @param wallet The wallet address to check
     * @return True if supported
     */
    function isSupportedWallet(address wallet) external view returns (bool) {
        return supportedWallets[wallet];
    }

    /**
     * @notice Withdraw ERC-20 tokens from this contract
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    // ============ ERC-4337 Paymaster Hooks ============

    /**
     * @dev Validate the UserOp — check that sender is a supported wallet
     * @param userOp The UserOperation
     * @param maxCost Maximum cost of the UserOp in ETH
     * @return context Context for postOp (encoded sender + maxCost)
     * @return validationData 0 if valid
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) internal view override returns (bytes memory context, uint256 validationData) {
        if (!supportedWallets[userOp.sender]) {
            revert UnsupportedWallet();
        }

        context = abi.encode(userOp.sender, maxCost);
        validationData = 0;
    }

    /**
     * @dev Post-operation: charge the wallet for actual gas used in USDC
     * @param context Context from _validatePaymasterUserOp
     * @param actualGasCost Actual gas cost in wei
     */
    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        (address sender, ) = abi.decode(context, (address, uint256));

        // Convert gas cost (wei) to USDC amount
        // actualGasCost is in wei (1e18), ethToUsdcRate has 6 decimals
        uint256 usdcCost = (actualGasCost * ethToUsdcRate) / 1e18;

        if (usdcCost > 0) {
            // Try to charge the wallet; absorb cost if transfer fails
            try usdc.transferFrom(sender, address(this), usdcCost) {
                emit GasCharged(sender, usdcCost);
            } catch {
                emit GasChargeFailed(sender, usdcCost);
            }
        }
    }
}
