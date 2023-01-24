##### Differences between `safeTransferFrom` and `transferFrom`

* `safeTranferFrom`  and `transferFrom` have at least three common arguments that are `from`, `to` and `tokenId`. However, `safeTransferFrom` may include an additional argument called `data`  that could be used internally and carry additional information. 
* Both methods rely on the internal method `_transfer(from, to, tokenId)` to update the mappings of balances and ownership. However, `safeTransferFrom` has an additional method called `_checkOnERC721Received` that checks whether the receiver is an smart contract. If this last condition is true, verifies that the smart contract is able to receive the NFT.



Characteristics of `_checkOnERC721Received` method:

- It has four arguments that are `from`, `to`, `tokenId` and `data` that come from the method `safeTransferFrom`.

- In the case that `to` is not a smart contract, the method `_checkOnERC721Received` will return true immediately.

- The way in which `to`, the receiver, is verified whether it is a smart contract or not, is by using the property `.code.length > 0` from `address` data type. If the length is greater than 0, then it is a smart contract.

- If `to`, the receiver, is a smart contract, a method `onERC721Received` is called on it. This method has four arguments (`operator`, `from`, `tokenId` and `data`) and a return data type (`bytes4 retval`). Only if the receiver returns `IERC721Receiver.onERC721Received.selector` when the method `onERC721Received` is called, the transfer would result in success.

- If `to`, the reciever, is a smart contract, and the call on `onERC721Received` fails, it will safe fail due to the `try-catch` mechanism used to call this method. If the call fails, it will revert. The revert could have two paths:

  - Fails because the receiver smart contract does not implement `onERC721Received`. In that case, it reverts with the following message `ERC721: transfer to non ERC721Receiver implementer`.

    ```solidity
    if (reason.length == 0) {
                        revert("ERC721: transfer to non ERC721Receiver implementer");
    }
    ```

    

  - Fails because even when the receiver smart contract implements `onERC721Received`, something went wrong while executing the method. In that case, to bubble up the error all the way to the calling smart contract, assembly is used:

    ```solidity
    	/// @solidity memory-safe-assembly
    	assembly {
    		revert(add(32, reason), mload(reason))
    	}
    ```


### Slither

Results from applying slither to `TokenSale.sol`:

```
TokenSale.depositTokens(uint256) (contracts/week-1/TokenSaleFlat.sol#679-684) performs a multiplication on the result of a division:
        - ethToSendBack = amount / RATIO (contracts/week-1/TokenSaleFlat.sol#682)
        - address(msg.sender).transfer((ethToSendBack * 90) / 100) (contracts/week-1/TokenSaleFlat.sol#683)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#divide-before-multiply

Different versions of Solidity are used:
        - Version used: ['0.8.17', '^0.8.0']
        - 0.8.17 (contracts/week-1/TokenSaleFlat.sol#626)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#7)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#87)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#113)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#141)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#508)
        - ^0.8.0 (contracts/week-1/TokenSaleFlat.sol#545)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#different-pragma-directives-are-used

Context._msgData() (contracts/week-1/TokenSaleFlat.sol#104-106) is never used and should be removed
ERC20._afterTokenTransfer(address,address,uint256) (contracts/week-1/TokenSaleFlat.sol#501) is never used and should be removed
ERC20._beforeTokenTransfer(address,address,uint256) (contracts/week-1/TokenSaleFlat.sol#485) is never used and should be removed
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code

Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#7) allows old versions
Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#87) allows old versions
Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#113) allows old versions
Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#141) allows old versions
Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#508) allows old versions
Pragma version^0.8.0 (contracts/week-1/TokenSaleFlat.sol#545) allows old versions
Pragma version0.8.17 (contracts/week-1/TokenSaleFlat.sol#626) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.16
solc-0.8.17 is not recommended for deployment
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity
```

Results:

1. It says that there is a division before a multiplication - CORRECT
2. Points out that there are different pragma version coming from the libraries - CORRECT
3. Says that using the latest pragma version is not recommended



### Testing

Command to test all files: `npx hardhat test`

Coverage: `npx hardhat coverage`

Result:

| File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| ----------------- | ------- | -------- | ------- | ------- | --------------- |
| week-1/           | 100     | 79.41    | 100     | 100     |                 |
| **AMM.sol**       | 100     | **100**  | 100     | 100     |                 |
| Ban.sol           | 100     | 75       | 100     | 100     |                 |
| BondingCurve.sol  | 100     | 50       | 100     | 100     |                 |
| GodMode.sol       | 100     | 50       | 100     | 100     |                 |
| **TokenSale.sol** | 100     | **100**  | 100     | 100     |                 |
| week-2/           | 93.1    | 66.67    | 87.5    | 94.74   |                 |
| NftEnumerable.sol | 92.31   | 75       | 85.71   | 94.44   | 33              |
| NftStaking.sol    | 93.75   | 60       | 88.89   | 95      | 49              |
| All files | 97.26 | 75   | 95.74 | 97.8 |      |
