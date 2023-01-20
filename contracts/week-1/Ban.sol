// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ban is ERC20Capped, Ownable {
    uint256 public constant MAX_CAP = 100 * 10 ** 6 * 10 ** 18;

    mapping(address => bool) banned;

    constructor() ERC20("TEST Token", "TTKN") ERC20Capped(MAX_CAP) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function banAccount(address account) external onlyOwner {
        banned[account] = true;
    }

    function _beforeTokenTransfer(
        address from,
        address,
        uint256
    ) internal view override {
        require(!banned[from], "ERC20: Banned account");
    }

    function _afterTokenTransfer(
        address,
        address to,
        uint256
    ) internal view override {
        require(!banned[to], "ERC20: Banned account");
    }
}
