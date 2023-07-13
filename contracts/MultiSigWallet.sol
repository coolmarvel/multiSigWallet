// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./IMultiSigWallet.sol";

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiSigWallet is IMultiSigWallet {
    using SafeERC20 for IERC20;

    /* =========== STATE VARIABLES ===========*/

    // number of max owner
    uint256 public constant MAX_OWNER_COUNT = 50;

    // minimum required confirmation number
    uint256 public quorum;

    // transaction struct set
    Transaction[] public transactions;

    // owners address set
    address[] public owners;

    // mapping from owner => bool
    mapping(address => bool) private _isOwner;

    // mapping from transaction id => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    constructor(address[] memory _owners, uint256 _quorum) {
        require(
            _owners.length > 2,
            "Treasury: Number of owners must be greater than 2 to guarantee it is a voting system."
        );
        require(
            _quorum > 1 && _quorum <= _owners.length,
            "Treasury: Number of confirmations does not satisfy quorum."
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Treasury: Owner cannot be 0.");
            require(!_isOwner[owner], "Treasury: Owner Address is duplicated.");

            _isOwner[owner] = true;
            owners.push(owner);
        }

        quorum = _quorum;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /* =========== FUNCTIONS ===========*/

    /**
     * @notice Send a transaction.
     * Only owner can access.
     * @param _to Target address.
     * @param _value Ether value.
     * @param _data Transaction data.
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner {
        uint256 transactionId = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                currentNumberOfConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, transactionId, _to, _value, _data);
    }

    /**
     * @notice Confirm a transaction.
     * Only owner can access.
     * @param _transactionId Transaction Id.
     */
    function confirmTransaction(
        uint256 _transactionId
    )
        public
        onlyOwner
        isTransactionExist(_transactionId)
        notExecuted(_transactionId)
        notConfirmed(_transactionId)
    {
        Transaction storage transaction = transactions[_transactionId];
        transaction.currentNumberOfConfirmations += 1;
        isConfirmed[_transactionId][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _transactionId);
    }

    /**
     * @notice Execute a transaction.
     * Only owner can access.
     * @param _transactionId Transaction Id.
     */
    function executeTransaction(
        uint256 _transactionId
    )
        public
        payable
        onlyOwner
        isTransactionExist(_transactionId)
        notExecuted(_transactionId)
    {
        Transaction storage transaction = transactions[_transactionId];

        require(
            transaction.currentNumberOfConfirmations >= quorum,
            "Treasury: Current Number Of Confirmations must be greater than or equal to quorum."
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Treasury: Transaction failed.");

        emit ExecuteTransaction(msg.sender, _transactionId);
    }

    /**
     * @notice Revoke a transaction.
     * Only owner can access.
     * @param _transactionId Transaction Id.
     */
    function revokeConfirmation(
        uint256 _transactionId
    )
        public
        onlyOwner
        isTransactionExist(_transactionId)
        notExecuted(_transactionId)
    {
        Transaction storage transaction = transactions[_transactionId];

        require(
            isConfirmed[_transactionId][msg.sender],
            "Treasury: Transaction is not confirmed"
        );

        transaction.currentNumberOfConfirmations -= 1;
        isConfirmed[_transactionId][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _transactionId);
    }

    /**
     * @notice Add Owner.
     * Owner addresses can access WUDC Treasury.
     * @param _newOwner Owner address to add.
     */
    function addOwner(
        address _newOwner
    )
        external
        onlyWallet
        notNull(_newOwner)
        isNotOneOfOwner(_newOwner)
        validRequirement(owners.length + 1, quorum)
    {
        _isOwner[_newOwner] = true;
        owners.push(_newOwner);

        emit AddOwner(_newOwner);
    }

    /**
     * @notice Remove Owner.
     * Owner addresses can access WUDC Treasury.
     * @param _owner Owner address to remove.
     */
    function removeOwner(
        address _owner
    ) external onlyWallet isOneOfOwner(_owner) {
        _isOwner[_owner] = false;

        for (uint256 i = 0; i < owners.length; ) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
            unchecked {
                i++;
            }
        }

        if (quorum > owners.length) {
            // changeQuorum(owners.length);
            quorum = owners.length;
            emit ChangeQuorum(owners.length);
        }

        emit RemoveOwner(_owner);
    }

    /**
     * @notice Replace Owner.
     * Owner addresses can access WUDC Treasury.
     * @param _owner Owner address to remove.
     * @param _newOwner Owner address to add.
     */
    function replaceOwner(
        address _owner,
        address _newOwner
    ) external onlyWallet isOneOfOwner(_owner) isNotOneOfOwner(_newOwner) {
        for (uint i = 0; i < owners.length; ) {
            if (owners[i] == _owner) {
                owners[i] = _newOwner;
                break;
            }
            unchecked {
                i++;
            }
        }

        _isOwner[_owner] = false;
        _isOwner[_newOwner] = true;

        emit RemoveOwner(_owner);
        emit AddOwner(_newOwner);
    }

    /**
     * @notice Minimum required confirmation number .
     * @param _quorum Minimum number of confirmation.
     */
    function changeQuorum(
        uint256 _quorum
    ) external onlyWallet validRequirement(owners.length, _quorum) {
        quorum = _quorum;

        emit ChangeQuorum(_quorum);
    }

    /* ========== VIEW FUNCTION ========== */

    /**
     * @notice Check Owner.
     */
    function isOwner(address _owner) public view returns (bool) {
        return _isOwner[_owner];
    }

    /**
     * @notice Get Owners.
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @notice Get Owners Count.
     */
    function getOwnerCount() public view returns (uint256) {
        return owners.length;
    }

    /**
     * @notice Get Transaction.
     * @return to Target address.
     * @return value Ether value.
     * @return data Transaction data.
     * @return executed Execute or Not.
     * @return currentNumberOfConfirmations Number of Confirmations.
     */
    function getTransaction(
        uint256 _transactionId
    )
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 currentNumberOfConfirmations
        )
    {
        Transaction storage transaction = transactions[_transactionId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.currentNumberOfConfirmations
        );
    }

    /**
     * @notice Get Transaction Count.
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyOwner() {
        require(_isOwner[msg.sender], "Treasury: Only Owner can access.");
        _;
    }

    modifier isOneOfOwner(address _owner) {
        require(_isOwner[_owner], "Treasury: Only Owner can access.");
        _;
    }

    modifier isNotOneOfOwner(address _owner) {
        require(!_isOwner[_owner], "Treasury: Owner can not access.");
        _;
    }

    modifier onlyWallet() {
        require(
            msg.sender == address(this),
            "Treasury: Only Wallet can access."
        );
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0), "Treasury: Owner cannot be 0.");
        _;
    }

    modifier isTransactionExist(uint256 _transactionId) {
        require(
            _transactionId < transactions.length,
            "Treasury: Transaction does not exist."
        );
        _;
    }

    modifier notExecuted(uint256 _transactionId) {
        require(
            !transactions[_transactionId].executed,
            "Treasury: Transaction is already executed."
        );
        _;
    }

    modifier notConfirmed(uint256 _transactionId) {
        require(
            !isConfirmed[_transactionId][msg.sender],
            "Treasury: Transaction is already confirmed"
        );
        _;
    }

    modifier validRequirement(uint256 _ownerCount, uint256 _quorum) {
        require(
            _ownerCount <= MAX_OWNER_COUNT &&
                _quorum <= _ownerCount &&
                _quorum != 0 &&
                _ownerCount != 0,
            "Treasury: Invalid Requirement."
        );
        _;
    }
}
