// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title HumanIDPayments
 * @notice Part of the Human ID payment system
 */
contract HumanIDPayments is AccessControl {
    using ECDSA for bytes32;

    // Custom errors
    error InvalidOracleAddress();
    error PaymentAlreadyExists();
    error InvalidAmount();
    error TimestampInFuture();
    error SignatureTooOld();
    error InvalidSignature();
    error PaymentDoesNotExist();
    error AlreadyRefunded();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidRecipient();
    error NoBalanceToWithdraw();
    error MustSendETH();
    error EmptyBatch();
    error ArrayLengthMismatch();
    error IncorrectTotalAmount();

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Payment struct
    struct Payment {
        bytes32 commitment;
        bytes32 service;
        uint256 timestamp;
        address sender;
        uint256 amount;
        bool refunded;
    }

    // State variables
    mapping(bytes32 => Payment) public payments;
    address public oracleAddress;

    // Events
    event PaymentReceived(
        bytes32 indexed commitment,
        address indexed sender,
        uint256 amount,
        bytes32 service,
        uint256 timestamp
    );

    event RefundIssued(
        bytes32 indexed commitment,
        address indexed recipient,
        uint256 amount
    );

    event RefundIssuedByAdmin(
        bytes32 indexed commitment,
        address indexed recipient,
        uint256 amount
    );

    event AdminWithdrawal(
        address indexed admin,
        address indexed to,
        uint256 amount
    );

    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    event FundsDeposited(
        address indexed sender,
        uint256 amount
    );

    /**
     * @notice Constructor
     * @param _oracleAddress Address of the oracle that signs payment and refund requests
     */
    constructor(address _oracleAddress) {
        if (_oracleAddress == address(0)) revert InvalidOracleAddress();
        oracleAddress = _oracleAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Make a payment for a service using a commitment
     * @param commitment The commitment hash (user's secret)
     * @param service The service identifier
     * @param timestamp The timestamp from the signature
     * @param signature oracle's EIP-191 signature of the payment
     */
    function pay(
        bytes32 commitment,
        bytes32 service,
        uint256 timestamp,
        bytes memory signature
    ) external payable {
        _processPayment(commitment, service, msg.value, timestamp, signature);
    }

    /**
     * @notice Make multiple payments in a single transaction
     * @param commitments Array of commitment hashes
     * @param services Array of service identifiers
     * @param amounts Array of payment amounts
     * @param timestamps Array of timestamps from signatures
     * @param signatures Array of oracle's EIP-191 signatures
     */
    function batchPay(
        bytes32[] calldata commitments,
        bytes32[] calldata services,
        uint256[] calldata amounts,
        uint256[] calldata timestamps,
        bytes[] calldata signatures
    ) external payable {
        uint256 length = commitments.length;

        // Validate arrays
        if (length == 0) revert EmptyBatch();
        if (services.length != length || amounts.length != length ||
            timestamps.length != length || signatures.length != length) {
            revert ArrayLengthMismatch();
        }

        // Verify total amount matches msg.value
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < length; i++) {
            totalAmount += amounts[i];
        }
        if (msg.value != totalAmount) revert IncorrectTotalAmount();

        // Process each payment
        for (uint256 i = 0; i < length; i++) {
            _processPayment(commitments[i], services[i], amounts[i], timestamps[i], signatures[i]);
        }
    }

    /**
     * @notice Internal function to process a single payment
     * @param commitment The commitment hash
     * @param service The service identifier
     * @param amount The payment amount
     * @param timestamp The timestamp from the signature
     * @param signature Oracle's EIP-191 signature
     */
    function _processPayment(
        bytes32 commitment,
        bytes32 service,
        uint256 amount,
        uint256 timestamp,
        bytes memory signature
    ) internal {
        // Validate amount
        if (amount == 0) revert InvalidAmount();

        // Check payment doesn't already exist
        if (payments[commitment].amount != 0) revert PaymentAlreadyExists();

        // Verify timestamp is within the last year. Why so long? Companies might want to use batch payments to pay
        // for their users over a longer period of time (e.g. a month). We should be able to support this.
        if (timestamp > block.timestamp) revert TimestampInFuture();
        if (block.timestamp - timestamp > 365 days) revert SignatureTooOld();

        // Verify EIP-191 signature from oracle
        bytes32 messageHash = keccak256(
            abi.encode(amount, commitment, service, block.chainid, timestamp)
        );
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        if (signer != oracleAddress) revert InvalidSignature();

        // Store payment
        payments[commitment] = Payment({
            commitment: commitment,
            service: service,
            timestamp: block.timestamp,
            sender: msg.sender,
            amount: amount,
            refunded: false
        });

        emit PaymentReceived(commitment, msg.sender, amount, service, block.timestamp);
    }

    /**
     * @notice Refund a payment using oracle signature
     * @param commitment The commitment hash
     * @param timestamp The timestamp from the signature
     * @param signature oracle's EIP-191 signature authorizing the refund
     * @dev REENTRANCY NOTICE: This function is protected by CEI pattern.
     * payment.refunded is set before external call. DO NOT add functions
     * that can modify payment state without reentrancy protection.
     */
    function refund(bytes32 commitment, uint256 timestamp, bytes memory signature) external {
        Payment storage payment = payments[commitment];
        if (payment.amount == 0) revert PaymentDoesNotExist();
        if (payment.refunded) revert AlreadyRefunded();

        // Verify timestamp is within the last year
        if (timestamp > block.timestamp) revert TimestampInFuture();
        if (block.timestamp - timestamp > 10 minutes) revert SignatureTooOld();

        // Verify EIP-191 refund signature from oracle
        bytes32 messageHash = keccak256(abi.encode(commitment, block.chainid, timestamp));
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        if (signer != oracleAddress) revert InvalidSignature();

        // Mark as refunded and send funds
        payment.refunded = true;
        (bool success, ) = payment.sender.call{value: payment.amount}("");
        if (!success) revert TransferFailed();

        emit RefundIssued(commitment, payment.sender, payment.amount);
    }

    /**
     * @notice Get contract balance
     * @return Current balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Deposit funds into contract (useful for maintaining refund reserves)
     */
    function deposit() external payable {
        if (msg.value == 0) revert MustSendETH();
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Receive function for direct ETH transfers
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // ---------------------------------------------------------------------
    // Admin functions.
    // 
    // A note about our design decisions:
    // Admins are granted significant authority. While this is potentially
    // risky, we do not consider it a problem here. Why? This contract is
    // not meant to handle significant amounts of funds. The actual amount
    // of money in this contract at any point in time should be just enough
    // to handle refunds. All funds are regularly swept into more secure
    // wallets. If one of the admin accounts were compromised, we would
    // simply deploy a new contract with new admins and update our frontend.
    // ---------------------------------------------------------------------

    /**
     * @notice Force refund a payment (admin only, for customer support)
     * @param commitment The commitment hash to refund
     */
    function forceRefund(bytes32 commitment) external onlyRole(ADMIN_ROLE) {
        Payment storage payment = payments[commitment];
        if (payment.amount == 0) revert PaymentDoesNotExist();
        if (payment.refunded) revert AlreadyRefunded();

        // Mark as refunded and send funds
        payment.refunded = true;
        (bool success, ) = payment.sender.call{value: payment.amount}("");
        if (!success) revert TransferFailed();

        emit RefundIssuedByAdmin(commitment, payment.sender, payment.amount);
    }

    /**
     * @notice Withdraw specific amount to admin (admin only)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (amount > address(this).balance) revert InsufficientBalance();
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit AdminWithdrawal(msg.sender, msg.sender, amount);
    }

    /**
     * @notice Withdraw specific amount to specified address (admin only)
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawTo(uint256 amount, address payable to) external onlyRole(ADMIN_ROLE) {
        if (to == address(0)) revert InvalidRecipient();
        if (amount > address(this).balance) revert InsufficientBalance();
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit AdminWithdrawal(msg.sender, to, amount);
    }

    /**
     * @notice Withdraw all funds to admin (admin only)
     */
    function withdrawAll() external onlyRole(ADMIN_ROLE) {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoBalanceToWithdraw();
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit AdminWithdrawal(msg.sender, msg.sender, amount);
    }

    /**
     * @notice Update oracle address (admin only)
     * @param newOracle New oracle address
     */
    function setOracleAddress(address newOracle) external onlyRole(ADMIN_ROLE) {
        if (newOracle == address(0)) revert InvalidOracleAddress();
        address oldOracle = oracleAddress;
        oracleAddress = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

}
