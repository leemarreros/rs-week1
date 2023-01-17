// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BondingCurveToken is ERC20, ERC20Burnable, Ownable {
    uint256 public poolBalance;

    constructor() ERC20("Bonding Curve Token", "BCT") {}

    /// @notice Purchase BCT tokens by sending Eth
    /// @dev The amount of Eth is calculated following a linear bonding curve
    /// @param numTokens Amount of tokens to purchase
    function mint(uint256 numTokens) public payable {
        uint256 priceEth = _ethPriceForTokens(numTokens);
        require(msg.value >= priceEth, "Not enough Eth sent");

        poolBalance += msg.value;

        _mint(msg.sender, numTokens);
    }

    /// @notice Bruns BCT tokens to receive Eth
    /// @dev The amount of Eth is calculated following a linear bonding curve
    /// @param numTokens Amount of tokens to burn
    function burn(uint256 numTokens) public override {
        uint256 etherAmount = _getEthByNumberOfTokens(numTokens);
        _burn(msg.sender, numTokens);

        poolBalance -= etherAmount;
        uint256 net = (etherAmount * 90) / 100;

        payable(msg.sender).transfer(net);
    }

    function _ethPriceForTokens(
        uint256 numTokens
    ) internal view returns (uint256) {
        uint256 x = totalSupply() + numTokens;
        uint256 y = (4 * x) / 987654321;
        uint256 area = _calculateArea(x, y);

        return area - poolBalance;
    }

    function _getEthByNumberOfTokens(
        uint256 numTokens
    ) internal view returns (uint256) {
        uint256 x = totalSupply() - numTokens;
        uint256 y = (4 * x) / 987654321;
        uint256 area = _calculateArea(x, y);

        return poolBalance - area;
    }

    function _calculateArea(
        uint256 x,
        uint256 y
    ) internal view returns (uint256) {
        return (x * y) / 2 / 10 ** decimals();
    }

    /// @notice Estimate the amount of Eth based on amount of tokens to receive
    /// @dev The amount of Eth is calculated with the following formula: (4 * x) / 987654321
    /// @param amountTokens Amount of tokens to burn
    /// @return Amount of Eth to send in order to receive 'amountTokens'
    function estimateEthToSend(
        uint256 amountTokens
    ) external view returns (uint256) {
        return _ethPriceForTokens(amountTokens);
    }
}
