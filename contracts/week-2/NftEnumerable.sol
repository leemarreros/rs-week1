// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "hardhat/console.sol";

contract EnumerableNFT is ERC721, ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC721("Enumerable NFT", "ENMNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) {
        require(tokenId > 0 && tokenId < 21, "Id must be between 1 to 20");
        _safeMint(to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

interface IERC721Ext is IERC721, IERC721Enumerable {}

contract PrimeFinder {
    uint256 public constant MAX_LIMIT_PRIME = 20;
    bool[] public inversePrimeList = new bool[](MAX_LIMIT_PRIME + 1);

    IERC721Ext nft;

    constructor(IERC721Ext _nft) {
        nft = _nft;
        _buildPrimeList();
    }

    function getPrimeCounter(
        address _account
    ) external view returns (uint256 amountPrime) {
        uint256 balance = nft.balanceOf(_account);

        for (uint256 i; i < balance; i++) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(_account, i);
            if (!inversePrimeList[tokenId]) amountPrime++;
        }
    }

    function _buildPrimeList() internal {
        for (uint256 i = 2; i * i <= MAX_LIMIT_PRIME; i++) {
            if (!inversePrimeList[i]) {
                for (uint256 j = 2 * i; j <= MAX_LIMIT_PRIME; j += i) {
                    inversePrimeList[j] = true;
                }
            }
        }
        inversePrimeList[0] = true;
        inversePrimeList[1] = true;
        inversePrimeList[2] = true;
    }
}
