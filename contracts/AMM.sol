// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenA is ERC20, Ownable {
    constructor() ERC20("Token A", "TKNA") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract TokenB is ERC20, Ownable {
    constructor() ERC20("Token B", "TKNB") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract AMM {
    uint256 public K;
    IERC20 tokenA;
    IERC20 tokenB;

    /// @notice Adds liquidity for token A and token B
    /// @dev Both tokens A and B are deposited to AMM SC
    /// @param tokenAAdd Address of token A
    /// @param tokenBAdd Address of token B
    /// @param _amountTokenA Amount to deposit of token A
    /// @param _amountTokenB Amount to deposit of token B
    function provideLiquidity(
        address tokenAAdd,
        address tokenBAdd,
        uint256 _amountTokenA,
        uint256 _amountTokenB
    ) external {
        K = _amountTokenA * _amountTokenB;

        tokenA = IERC20(tokenAAdd);
        tokenB = IERC20(tokenBAdd);

        tokenA.transferFrom(msg.sender, address(this), _amountTokenA);
        tokenB.transferFrom(msg.sender, address(this), _amountTokenB);
    }

    /// @notice Exchange origin token for an amount of destination token
    /// @dev The amount of destination to recibe is based on: token A * token B = K
    /// @param originTok Address of origin token
    /// @param destTok Address of destination token
    /// @param amountToken Amount to deposit of the origin token
    function exchangeTokens(
        IERC20 originTok,
        IERC20 destTok,
        uint256 amountToken
    ) external {
        originTok.transferFrom(msg.sender, address(this), amountToken);
        uint256 newDestTokBal = K / originTok.balanceOf(address(this));
        uint256 delta = destTok.balanceOf(address(this)) - newDestTokBal;
        destTok.transfer(msg.sender, delta);
    }
}
