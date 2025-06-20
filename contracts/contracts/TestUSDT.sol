// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUSDT is ERC20 {
    constructor() ERC20("Test USDT", "USDT") {
        // Mint 1 million USDT to deployer
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    // Function to mint test tokens to any address (only for testing)
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
} 