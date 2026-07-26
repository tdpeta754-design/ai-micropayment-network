// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {SmartWallet} from "./SmartWallet.sol";

/**
 * @title WalletFactory
 * @dev Factory for deploying SmartWallet instances using CREATE2
 */
contract WalletFactory {
    uint256 public totalWallets;
    mapping(address => address[]) public ownerWallets;

    event WalletCreated(address indexed wallet, address indexed owner, uint256 salt);

    /**
     * @notice Deploy a SmartWallet using CREATE2
     * @param owner The initial owner of the wallet
     * @param salt A random value for CREATE2
     * @param entryPoint The EntryPoint address
     * @return wallet The address of the deployed wallet
     */
    function createWallet(address owner, uint256 salt, address entryPoint) external returns (address wallet) {
        address predictedAddress = getWalletAddress(owner, salt, entryPoint);
        
        if (predictedAddress.code.length > 0) {
            return predictedAddress;
        }

        bytes memory bytecode = abi.encodePacked(
            type(SmartWallet).creationCode,
            abi.encode(IEntryPoint(entryPoint), owner)
        );

        wallet = Create2.deploy(0, bytes32(salt), bytecode);
        
        ownerWallets[owner].push(wallet);
        totalWallets++;
        
        emit WalletCreated(wallet, owner, salt);
    }

    /**
     * @notice Get the deterministic address of a SmartWallet
     * @param owner The initial owner of the wallet
     * @param salt A random value for CREATE2
     * @param entryPoint The EntryPoint address
     * @return The predicted address
     */
    function getWalletAddress(address owner, uint256 salt, address entryPoint) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SmartWallet).creationCode,
            abi.encode(IEntryPoint(entryPoint), owner)
        );
        bytes32 bytecodeHash = keccak256(bytecode);
        return Create2.computeAddress(bytes32(salt), bytecodeHash);
    }

    /**
     * @notice Get all wallets for a specific owner
     * @param owner The owner address
     * @return An array of wallet addresses
     */
    function getWalletsByOwner(address owner) external view returns (address[] memory) {
        return ownerWallets[owner];
    }
}
