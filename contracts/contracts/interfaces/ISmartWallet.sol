// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISmartWallet
 * @dev Interface for the SmartWallet.
 */
interface ISmartWallet {
    /**
     * @notice Execute a single transaction
     * @param dest The destination address
     * @param value The value to send
     * @param func The calldata to execute
     */
    function execute(address dest, uint256 value, bytes calldata func) external;

    /**
     * @notice Execute a batch of transactions
     * @param dest The array of destination addresses
     * @param values The array of values to send
     * @param funcs The array of calldatas to execute
     */
    function executeBatch(address[] calldata dest, uint256[] calldata values, bytes[] calldata funcs) external;

    /**
     * @notice Get the deposit on the EntryPoint
     * @return The deposit amount
     */
    function getDeposit() external view returns (uint256);

    /**
     * @notice Add a deposit to the EntryPoint
     */
    function addDeposit() external payable;

    /**
     * @notice Get the owner of the wallet
     * @return The owner's address
     */
    function owner() external view returns (address);

    /**
     * @notice Get the current nonce
     * @return The nonce
     */
    function getNonce() external view returns (uint256);
}
