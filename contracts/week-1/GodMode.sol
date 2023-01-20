// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GodMode is ERC20Capped, Ownable {
    uint256 public constant MAX_CAP = 100_000_000 * 10 ** 18;

    constructor() ERC20("TEST Token", "TTKN") ERC20Capped(MAX_CAP) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function transferFromToGod(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        _transfer(from, to, amount);
    }
}
