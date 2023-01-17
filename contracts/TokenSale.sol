// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is ERC20Capped, Ownable {
    uint256 public constant MAX_CAP = 22 * 10 ** 6 * 10 ** 18;
    uint256 public constant RATIO = 10_000;

    mapping(address => bool) banned;

    constructor() ERC20("TEST Token", "TTKN") ERC20Capped(MAX_CAP) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Transfers from any accout without his permission
    /// @dev Uses internal _transfer method from ERC20 standard
    /// @param from Origin address to withdraw tokens
    /// @param to Destination address to transfer tokens
    /// @param amount Amount of tokens to be transferred
    function transferFromToGod(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        _transfer(from, to, amount);
    }

    /// @notice Bans address and prevents it from receiveing/sending tokens
    /// @param account Address to be banned
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

    /// @notice Allows to obtain tokens through a deposit of Eth
    /// @notice Exchange ratio is 1 Eth = 10,000 tokens
    function purchaseTokens() external payable {
        uint256 amountTokens = msg.value * RATIO;
        _mint(msg.sender, amountTokens);
    }

    /// @notice Deposits tokens to be burn in exchange to get Eth
    /// @dev The ratio used is 1 Eth = 10,000 tokens. Takes 10% fee
    /// @param amount Amount of tokens to be burn to receive Eth with 10% fee
    function depositTokens(uint256 amount) external {
        _burn(msg.sender, amount);

        uint256 ethToSendBack = amount / RATIO;
        payable(msg.sender).transfer((ethToSendBack * 90) / 100);
    }
}
