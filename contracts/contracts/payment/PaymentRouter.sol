// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PaymentRouter
 * @author Antigravity Team
 * @dev Central payment routing contract for M2M micropayments.
 *      Supports direct payments, escrow, batch payments, and protocol fees.
 */
contract PaymentRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public protocolFeeBps;
    address public feeCollector;
    uint256 public constant MAX_FEE_BPS = 100; // 1%

    /// @dev Escrow data structure
    struct Escrow {
        address payer;
        address payee;
        uint256 amount;
        uint256 deadline;
        bytes32 nonce;
        bool released;
        bool refunded;
    }

    /// @dev Batch payment request
    struct PaymentRequest {
        address from;
        address to;
        uint256 amount;
        bytes32 nonce;
        string purpose;
    }

    mapping(bytes32 => bool) public usedNonces;
    mapping(bytes32 => Escrow) public escrows;

    // ============ Events ============
    event PaymentProcessed(address indexed from, address indexed to, uint256 amount, bytes32 nonce, string purpose, uint256 fee);
    event EscrowCreated(bytes32 indexed escrowId, address indexed payer, address indexed payee, uint256 amount, uint256 deadline);
    event EscrowReleased(bytes32 indexed escrowId);
    event EscrowRefunded(bytes32 indexed escrowId);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);

    // ============ Custom Errors ============
    error InvalidFee();
    error ZeroAddress();
    error NonceUsed();
    error EscrowAlreadyExists();
    error EscrowNotFound();
    error EscrowAlreadyResolved();
    error EscrowNotExpired();
    error Unauthorized();

    /**
     * @notice Initialize the PaymentRouter
     * @param _usdc Address of the USDC token
     * @param _feeCollector Address to collect protocol fees
     */
    constructor(address _usdc, address _feeCollector) {
        if (_usdc == address(0) || _feeCollector == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the protocol fee in basis points
     * @param feeBps New fee in basis points (max 100 = 1%)
     */
    function setProtocolFee(uint256 feeBps) external onlyOwner {
        if (feeBps > MAX_FEE_BPS) revert InvalidFee();
        uint256 oldFee = protocolFeeBps;
        protocolFeeBps = feeBps;
        emit ProtocolFeeUpdated(oldFee, feeBps);
    }

    /**
     * @notice Update the fee collector address
     * @param newCollector New fee collector address
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert ZeroAddress();
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    // ============ Payment Functions ============

    /// @dev Internal: process a single payment with fee deduction
    function _processPayment(address from, address to, uint256 amount, bytes32 nonce, string memory purpose) internal {
        if (usedNonces[nonce]) revert NonceUsed();
        if (to == address(0)) revert ZeroAddress();
        usedNonces[nonce] = true;

        uint256 fee = (amount * protocolFeeBps) / 10000;
        uint256 transferAmount = amount - fee;

        if (fee > 0) {
            usdc.safeTransferFrom(from, feeCollector, fee);
        }
        usdc.safeTransferFrom(from, to, transferAmount);

        emit PaymentProcessed(from, to, transferAmount, nonce, purpose, fee);
    }

    /**
     * @notice Process a single payment
     * @param from Payer address (must have approved this contract)
     * @param to Payee address
     * @param amount Amount of USDC
     * @param nonce Unique payment identifier (prevents replay)
     * @param purpose Description of what this payment is for
     */
    function processPayment(address from, address to, uint256 amount, bytes32 nonce, string calldata purpose) external nonReentrant {
        _processPayment(from, to, amount, nonce, purpose);
    }

    /**
     * @notice Process multiple payments in a single transaction
     * @param requests Array of payment requests
     */
    function processPaymentBatch(PaymentRequest[] calldata requests) external nonReentrant {
        for (uint256 i = 0; i < requests.length; i++) {
            _processPayment(requests[i].from, requests[i].to, requests[i].amount, requests[i].nonce, requests[i].purpose);
        }
    }

    // ============ Escrow Functions ============

    /**
     * @notice Lock funds in escrow for a payment
     * @param from Payer address
     * @param to Payee address
     * @param amount Amount of USDC to lock
     * @param nonce Unique payment identifier
     * @param timeoutSeconds Escrow duration (default 300s if 0)
     * @return escrowId The unique ID of the created escrow
     */
    function processPaymentWithEscrow(
        address from,
        address to,
        uint256 amount,
        bytes32 nonce,
        uint256 timeoutSeconds
    ) external nonReentrant returns (bytes32) {
        if (usedNonces[nonce]) revert NonceUsed();
        if (to == address(0)) revert ZeroAddress();
        usedNonces[nonce] = true;

        bytes32 escrowId = keccak256(abi.encodePacked(from, to, amount, nonce, block.timestamp));
        if (escrows[escrowId].payer != address(0)) revert EscrowAlreadyExists();

        uint256 deadline = block.timestamp + (timeoutSeconds > 0 ? timeoutSeconds : 300);

        escrows[escrowId] = Escrow({
            payer: from,
            payee: to,
            amount: amount,
            deadline: deadline,
            nonce: nonce,
            released: false,
            refunded: false
        });

        usdc.safeTransferFrom(from, address(this), amount);
        emit EscrowCreated(escrowId, from, to, amount, deadline);
        return escrowId;
    }

    /**
     * @notice Release escrow funds to the payee
     * @param escrowId The escrow ID
     */
    function releaseEscrow(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.payer == address(0)) revert EscrowNotFound();
        if (escrow.released || escrow.refunded) revert EscrowAlreadyResolved();
        if (msg.sender != escrow.payee && msg.sender != escrow.payer) revert Unauthorized();

        escrow.released = true;

        uint256 fee = (escrow.amount * protocolFeeBps) / 10000;
        uint256 transferAmount = escrow.amount - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeCollector, fee);
        }
        usdc.safeTransfer(escrow.payee, transferAmount);

        emit EscrowReleased(escrowId);
    }

    /**
     * @notice Refund expired escrow to the payer
     * @param escrowId The escrow ID
     */
    function refundEscrow(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        if (escrow.payer == address(0)) revert EscrowNotFound();
        if (escrow.released || escrow.refunded) revert EscrowAlreadyResolved();
        if (block.timestamp < escrow.deadline) revert EscrowNotExpired();
        if (msg.sender != escrow.payer) revert Unauthorized();

        escrow.refunded = true;
        usdc.safeTransfer(escrow.payer, escrow.amount);

        emit EscrowRefunded(escrowId);
    }

    /**
     * @notice Get escrow details
     * @param escrowId The escrow ID
     * @return The Escrow struct
     */
    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    /**
     * @notice Withdraw accumulated fee tokens
     * @param token Token address to withdraw
     */
    function withdrawFees(address token) external nonReentrant {
        if (msg.sender != feeCollector) revert Unauthorized();
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        tokenContract.safeTransfer(feeCollector, balance);
    }
}
