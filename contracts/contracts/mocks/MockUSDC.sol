// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock ERC20 token for USDC testing. Anyone can mint.
 */
contract MockUSDC is ERC20 {
    /**
     * @notice Constructor for MockUSDC
     */
    constructor() ERC20("Mock USDC", "USDC") {}

    /**
     * @notice Returns the number of decimals used to get its user representation.
     * For USDC, it is 6.
     * @return The number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mints tokens to a specified address.
     * @param to The address to mint to.
     * @param amount The amount to mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function that mints 1000 USDC to the caller.
     */
    function faucet() public {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
