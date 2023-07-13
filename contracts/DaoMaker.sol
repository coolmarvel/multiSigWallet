// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./MultiSigWallet.sol";

contract WonderDaoMaker is MultiSigWallet {
    constructor(
        address[] memory _owners,
        uint256 _quorum
    ) MultiSigWallet(_owners, _quorum) {}
}
