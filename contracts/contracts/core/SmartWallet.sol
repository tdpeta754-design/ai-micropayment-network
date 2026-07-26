// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {UserOperation} from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ISmartWallet} from "../interfaces/ISmartWallet.sol";

/**
 * @title SmartWallet
 * @author Antigravity Team
 * @dev ERC-4337 compatible smart wallet for AI Agents with spending limits,
 *      session keys, whitelist/blacklist, and emergency pause.
 */
contract SmartWallet is IAccount, ISmartWallet, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ State Variables ============
    address public owner;
    IEntryPoint public immutable entryPoint;
    bool public paused;

    /// @dev Spending policy configuration
    struct SpendingPolicy {
        uint256 maxPerTransaction;
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 cooldownSeconds;
    }
    SpendingPolicy public spendingPolicy;

    // Spending tracking state
    uint256 public dailySpent;
    uint256 public monthlySpent;
    uint256 public lastTxTimestamp;
    uint256 public dailyResetTime;
    uint256 public monthlyResetTime;

    /// @dev Session key data
    struct SessionKey {
        uint48 validAfter;
        uint48 validUntil;
        uint256 spendLimit;
        uint256 spent;
        bool active;
    }
    mapping(address => SessionKey) public sessionKeys;

    // Whitelist / Blacklist
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public blacklisted;
    bool public whitelistEnabled;

    uint256 private constant SIG_VALIDATION_FAILED = 1;

    // ============ Events ============
    event WalletInitialized(address indexed entryPoint, address indexed owner);
    event TransactionExecuted(address indexed dest, uint256 value, bytes func);
    event SessionKeyAdded(address indexed key, uint48 validAfter, uint48 validUntil, uint256 spendLimit);
    event SessionKeyRevoked(address indexed key);
    event SpendingPolicyUpdated(uint256 maxPerTransaction, uint256 dailyLimit, uint256 monthlyLimit, uint256 cooldownSeconds);
    event WalletPaused();
    event WalletUnpaused();
    event GuardrailTriggered(string reason);
    event Received(address indexed sender, uint256 amount);

    // ============ Custom Errors ============
    error NotOwner();
    error NotEntryPoint();
    error NotEntryPointOrOwner();
    error WalletIsPaused();
    error DestBlacklisted(address dest);
    error DestNotWhitelisted(address dest);
    error ExceedsMaxPerTx(uint256 value);
    error ExceedsDailyLimit(uint256 value);
    error ExceedsMonthlyLimit(uint256 value);
    error CooldownNotElapsed();
    error ArrayLengthMismatch();
    error CallFailed();

    // ============ Modifiers ============

    /// @notice Restricts to wallet owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Restricts to EntryPoint
    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert NotEntryPoint();
        _;
    }

    /// @notice Restricts to EntryPoint or owner
    modifier onlyEntryPointOrOwner() {
        if (msg.sender != address(entryPoint) && msg.sender != owner) revert NotEntryPointOrOwner();
        _;
    }

    /// @notice Ensures wallet is not paused
    modifier whenNotPaused() {
        if (paused) revert WalletIsPaused();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the SmartWallet
     * @param _entryPoint The ERC-4337 EntryPoint contract address
     * @param _owner The initial owner address (EOA)
     */
    constructor(IEntryPoint _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
        dailyResetTime = block.timestamp + 1 days;
        monthlyResetTime = block.timestamp + 30 days;
        emit WalletInitialized(address(_entryPoint), _owner);
    }

    // ============ ERC-4337 ============

    /**
     * @notice Validates a UserOperation from the EntryPoint
     * @param userOp The UserOperation struct
     * @param userOpHash The hash of the UserOperation
     * @param missingAccountFunds Funds needed to be deposited to the EntryPoint
     * @return validationData 0 if valid, 1 if signature validation failed
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(userOp.signature);

        if (signer == owner) {
            // Owner signature — always valid
        } else if (!_validateSessionKey(signer)) {
            return SIG_VALIDATION_FAILED;
        }

        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success); // Ignore - EntryPoint handles failure
        }

        return 0;
    }

    /**
     * @dev Validate a session key signer
     * @param signer The address that signed the UserOp
     * @return True if the session key is valid and active
     */
    function _validateSessionKey(address signer) internal view returns (bool) {
        SessionKey storage key = sessionKeys[signer];
        if (!key.active) return false;
        if (block.timestamp < key.validAfter || block.timestamp > key.validUntil) return false;
        if (key.spent >= key.spendLimit) return false;
        return true;
    }

    // ============ Execution ============

    /**
     * @notice Execute a single transaction
     * @param dest Target address
     * @param value ETH value to send
     * @param func Calldata to execute
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external override onlyEntryPointOrOwner whenNotPaused nonReentrant {
        _applyGuardrails(dest, value);
        _execute(dest, value, func);
    }

    /**
     * @notice Execute a batch of transactions
     * @param dest Array of target addresses
     * @param values Array of ETH values
     * @param funcs Array of calldatas
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata values,
        bytes[] calldata funcs
    ) external override onlyEntryPointOrOwner whenNotPaused nonReentrant {
        if (dest.length != values.length || dest.length != funcs.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < dest.length; i++) {
            _applyGuardrails(dest[i], values[i]);
            _execute(dest[i], values[i], funcs[i]);
        }
    }

    /// @dev Internal execute with low-level call
    function _execute(address dest, uint256 value, bytes calldata func) internal {
        (bool success, ) = dest.call{value: value}(func);
        if (!success) revert CallFailed();
        emit TransactionExecuted(dest, value, func);
    }

    // ============ Guardrails ============

    /// @dev Enforce spending policy before each transaction
    function _applyGuardrails(address dest, uint256 value) internal {
        // Blacklist check
        if (blacklisted[dest]) revert DestBlacklisted(dest);

        // Whitelist check
        if (whitelistEnabled && !whitelisted[dest]) revert DestNotWhitelisted(dest);

        if (value > 0) {
            // Per-transaction limit
            if (spendingPolicy.maxPerTransaction > 0 && value > spendingPolicy.maxPerTransaction) {
                emit GuardrailTriggered("ExceedsMaxPerTx");
                revert ExceedsMaxPerTx(value);
            }

            // Daily limit with auto-reset
            if (block.timestamp >= dailyResetTime) {
                dailySpent = 0;
                dailyResetTime = block.timestamp + 1 days;
            }
            if (spendingPolicy.dailyLimit > 0 && dailySpent + value > spendingPolicy.dailyLimit) {
                emit GuardrailTriggered("ExceedsDailyLimit");
                revert ExceedsDailyLimit(value);
            }

            // Monthly limit with auto-reset
            if (block.timestamp >= monthlyResetTime) {
                monthlySpent = 0;
                monthlyResetTime = block.timestamp + 30 days;
            }
            if (spendingPolicy.monthlyLimit > 0 && monthlySpent + value > spendingPolicy.monthlyLimit) {
                emit GuardrailTriggered("ExceedsMonthlyLimit");
                revert ExceedsMonthlyLimit(value);
            }

            // Cooldown
            if (spendingPolicy.cooldownSeconds > 0 && block.timestamp < lastTxTimestamp + spendingPolicy.cooldownSeconds) {
                emit GuardrailTriggered("CooldownNotElapsed");
                revert CooldownNotElapsed();
            }

            dailySpent += value;
            monthlySpent += value;
        }

        lastTxTimestamp = block.timestamp;
    }

    // ============ Owner Management ============

    /**
     * @notice Set spending policy for the wallet
     * @param maxPerTx Maximum value per transaction
     * @param dLimit Daily spending limit
     * @param mLimit Monthly spending limit
     * @param cooldown Minimum seconds between transactions
     */
    function setSpendingPolicy(
        uint256 maxPerTx,
        uint256 dLimit,
        uint256 mLimit,
        uint256 cooldown
    ) external onlyOwner {
        spendingPolicy = SpendingPolicy(maxPerTx, dLimit, mLimit, cooldown);
        emit SpendingPolicyUpdated(maxPerTx, dLimit, mLimit, cooldown);
    }

    /**
     * @notice Add a session key for an AI Agent
     * @param key The public address of the session key
     * @param validAfter Timestamp after which the key is valid
     * @param validUntil Timestamp until which the key is valid
     * @param spendLimit Maximum spending allowed for this key
     */
    function addSessionKey(address key, uint48 validAfter, uint48 validUntil, uint256 spendLimit) external onlyOwner {
        sessionKeys[key] = SessionKey(validAfter, validUntil, spendLimit, 0, true);
        emit SessionKeyAdded(key, validAfter, validUntil, spendLimit);
    }

    /**
     * @notice Revoke a session key
     * @param key The session key address to revoke
     */
    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    /// @notice Pause the wallet — blocks all execution
    function pause() external onlyOwner {
        paused = true;
        emit WalletPaused();
    }

    /// @notice Unpause the wallet
    function unpause() external onlyOwner {
        paused = false;
        emit WalletUnpaused();
    }

    /// @notice Set whitelist status for an address
    function setWhitelist(address addr, bool status) external onlyOwner {
        whitelisted[addr] = status;
    }

    /// @notice Set blacklist status for an address
    function setBlacklist(address addr, bool status) external onlyOwner {
        blacklisted[addr] = status;
    }

    /// @notice Enable or disable whitelist enforcement
    function setWhitelistEnabled(bool status) external onlyOwner {
        whitelistEnabled = status;
    }

    // ============ EntryPoint Deposit ============

    /// @notice Get deposit balance at EntryPoint
    function getDeposit() external view override returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    /// @notice Add deposit to EntryPoint for this wallet
    function addDeposit() external payable override {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /// @notice Get current nonce from EntryPoint
    function getNonce() external view override returns (uint256) {
        return entryPoint.getNonce(address(this), 0);
    }

    /// @notice Receive ETH
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
