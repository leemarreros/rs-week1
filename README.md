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

    