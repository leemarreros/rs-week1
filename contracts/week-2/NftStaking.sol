// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SimpleToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Simple Token", "SMPTKN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

contract SimpleNft is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Simple NFT", "SMPNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function safeMint(address to) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

interface IERC20Ext is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract Staking is IERC721Receiver {
    uint256 public constant DECIMALS = 10 ** 18;
    uint256 public constant AMOUNT_STAKING_TOKENS = 10 * DECIMALS;

    IERC20Ext public token;
    IERC721 public nft;

    struct Staker {
        address originalOwner;
        uint256 timePassed;
    }

    // tokenId => Staker {originalOwner, timePassed}
    mapping(uint256 => Staker) public stakers;

    constructor(IERC20Ext _token, IERC721 _nft) {
        token = _token;
        nft = _nft;
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        stakers[tokenId] = Staker(from, block.timestamp);
        return IERC721Receiver.onERC721Received.selector;
    }

    function claimTokens(uint256 tokenId) external {
        require(
            block.timestamp - stakers[tokenId].timePassed >= 1 days,
            "Did not pass 24 hours yet"
        );
        require(
            stakers[tokenId].originalOwner == msg.sender,
            "Not the original owner"
        );
        token.mint(msg.sender, AMOUNT_STAKING_TOKENS);
    }

    function withdrawNft(uint256 tokenId) external {
        require(
            stakers[tokenId].originalOwner == msg.sender,
            "Not the original owner"
        );
        delete stakers[tokenId];
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
    }
}
