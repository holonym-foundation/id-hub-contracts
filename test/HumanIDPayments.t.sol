// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "forge-std/Test.sol";
import "../contracts/HumanIDPayments.sol";

contract HumanIDPaymentsTest is Test {
    HumanIDPayments public payments;

    address public oracle;
    uint256 public oraclePrivateKey;
    address public admin;
    address public user1;
    address public user2;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

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

    function setUp() public {
        oraclePrivateKey = 0xA11CE;
        oracle = vm.addr(oraclePrivateKey);
        admin = makeAddr("admin");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(admin, 100 ether);

        payments = new HumanIDPayments(oracle);
    }

    // Helper function to create EIP-191 signature
    function signPayment(
        uint256 amount,
        bytes32 commitment,
        bytes32 service,
        uint256 timestamp
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(
            abi.encode(amount, commitment, service, block.chainid, timestamp)
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    function signRefund(
        bytes32 commitment,
        uint256 timestamp
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encode(commitment, block.chainid, timestamp));
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    // ============================================
    // Constructor Tests
    // ============================================

    function testConstructor() public view {
        assertEq(payments.oracleAddress(), oracle);
        assertTrue(payments.hasRole(payments.DEFAULT_ADMIN_ROLE(), address(this)));
        assertTrue(payments.hasRole(ADMIN_ROLE, address(this)));
    }

    function testConstructorRevertsOnZeroAddress() public {
        vm.expectRevert(HumanIDPayments.InvalidOracleAddress.selector);
        new HumanIDPayments(address(0));
    }

    // ============================================
    // pay() Tests
    // ============================================

    function testPay() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 timestamp = block.timestamp;

        bytes memory signature = signPayment(amount, commitment, service, timestamp);

        vm.expectEmit(true, true, false, true);
        emit PaymentReceived(commitment, user1, amount, service, block.timestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);

        (
            bytes32 storedCommitment,
            bytes32 storedService,
            uint256 storedTimestamp,
            address storedSender,
            uint256 storedAmount,
            bool refunded
        ) = payments.payments(commitment);

        assertEq(storedCommitment, commitment);
        assertEq(storedService, service);
        assertEq(storedTimestamp, block.timestamp);
        assertEq(storedSender, user1);
        assertEq(storedAmount, amount);
        assertFalse(refunded);
    }

    function testPayRevertsOnZeroAmount() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 0;
        uint256 timestamp = block.timestamp;

        bytes memory signature = signPayment(amount, commitment, service, timestamp);

        vm.expectRevert(HumanIDPayments.InvalidAmount.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);
    }

    function testPayRevertsOnDuplicateCommitment() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 timestamp = block.timestamp;

        bytes memory signature = signPayment(amount, commitment, service, timestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);

        vm.expectRevert(HumanIDPayments.PaymentAlreadyExists.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);
    }

    function testPayRevertsOnTimestampInFuture() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 timestamp = block.timestamp + 1;

        bytes memory signature = signPayment(amount, commitment, service, timestamp);

        vm.expectRevert(HumanIDPayments.TimestampInFuture.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);
    }

    function testPayRevertsOnSignatureTooOld() public {
        uint256 oldTimestamp = 1;
        vm.warp(oldTimestamp);
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;

        // Warp time forward to 366 days (more than 365 days)
        vm.warp(oldTimestamp + 365 days + 1);

        // Sign with old timestamp (signature will be valid but timestamp will be too old)
        // We sign after warping to ensure the signature is valid, but the timestamp is old
        bytes memory signature = signPayment(amount, commitment, service, oldTimestamp);

        // Now try to use the old timestamp - it should be too old
        // block.timestamp is now initialTimestamp + 365 days + 1
        // oldTimestamp is initialTimestamp
        // So block.timestamp - oldTimestamp = 365 days + 1, which is > 365 days
        vm.expectRevert(HumanIDPayments.SignatureTooOld.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, oldTimestamp, signature);
    }

    function testPayAcceptsExact365DaysOldSignature() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 oldTimestamp = block.timestamp;

        // Warp time forward to exactly 365 days
        vm.warp(block.timestamp + 365 days);

        // Sign with timestamp exactly 365 days old (should still be valid)
        bytes memory signature = signPayment(amount, commitment, service, oldTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, oldTimestamp, signature);

        (, , , address sender, uint256 storedAmount, ) = payments.payments(commitment);
        assertEq(sender, user1);
        assertEq(storedAmount, amount);
    }

    function testPayRevertsOnSignatureOneSecondTooOld() public {
        uint256 oldTimestamp = 1;
        vm.warp(oldTimestamp);
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;

        // Warp time forward to exactly 365 days + 1 second
        vm.warp(oldTimestamp + 365 days + 1);

        // Sign with old timestamp (signature will be valid but timestamp will be too old)
        // The signature uses oldTimestamp (1), but block.timestamp is now 31536002
        bytes memory signature = signPayment(amount, commitment, service, oldTimestamp);

        // Now try to use the old timestamp - it should be too old
        // block.timestamp (31536002) - oldTimestamp (1) = 31536001 > 365 days, so should revert
        vm.expectRevert(HumanIDPayments.SignatureTooOld.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, oldTimestamp, signature);
    }

    function testPayRevertsOnInvalidSignature() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 timestamp = block.timestamp;

        // Create signature with wrong private key
        uint256 wrongKey = 0xBAD;
        bytes32 messageHash = keccak256(
            abi.encode(amount, commitment, service, block.chainid, timestamp)
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(HumanIDPayments.InvalidSignature.selector);
        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, badSignature);
    }

    // ============================================
    // batchPay() Tests
    // ============================================

    function testBatchPay() public {
        uint256 count = 3;
        bytes32[] memory commitments = new bytes32[](count);
        bytes32[] memory services = new bytes32[](count);
        uint256[] memory amounts = new uint256[](count);
        uint256[] memory timestamps = new uint256[](count);
        bytes[] memory signatures = new bytes[](count);

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < count; i++) {
            commitments[i] = keccak256(abi.encode("secret", i));
            services[i] = keccak256(abi.encode("service", i));
            amounts[i] = (i + 1) * 1 ether;
            timestamps[i] = block.timestamp;
            signatures[i] = signPayment(amounts[i], commitments[i], services[i], timestamps[i]);
            totalAmount += amounts[i];
        }

        vm.prank(user1);
        payments.batchPay{value: totalAmount}(commitments, services, amounts, timestamps, signatures);

        for (uint256 i = 0; i < count; i++) {
            (, , , address sender, uint256 amount, ) = payments.payments(commitments[i]);
            assertEq(sender, user1);
            assertEq(amount, amounts[i]);
        }
    }

    function testBatchPayRevertsOnEmptyBatch() public {
        bytes32[] memory commitments = new bytes32[](0);
        bytes32[] memory services = new bytes32[](0);
        uint256[] memory amounts = new uint256[](0);
        uint256[] memory timestamps = new uint256[](0);
        bytes[] memory signatures = new bytes[](0);

        vm.expectRevert(HumanIDPayments.EmptyBatch.selector);
        vm.prank(user1);
        payments.batchPay(commitments, services, amounts, timestamps, signatures);
    }

    function testBatchPayRevertsOnArrayLengthMismatch() public {
        bytes32[] memory commitments = new bytes32[](2);
        bytes32[] memory services = new bytes32[](1);
        uint256[] memory amounts = new uint256[](2);
        uint256[] memory timestamps = new uint256[](2);
        bytes[] memory signatures = new bytes[](2);

        vm.expectRevert(HumanIDPayments.ArrayLengthMismatch.selector);
        vm.prank(user1);
        payments.batchPay(commitments, services, amounts, timestamps, signatures);
    }

    function testBatchPayRevertsOnIncorrectTotalAmount() public {
        uint256 count = 2;
        bytes32[] memory commitments = new bytes32[](count);
        bytes32[] memory services = new bytes32[](count);
        uint256[] memory amounts = new uint256[](count);
        uint256[] memory timestamps = new uint256[](count);
        bytes[] memory signatures = new bytes[](count);

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < count; i++) {
            commitments[i] = keccak256(abi.encode("secret", i));
            services[i] = keccak256(abi.encode("service", i));
            amounts[i] = (i + 1) * 1 ether;
            timestamps[i] = block.timestamp;
            signatures[i] = signPayment(amounts[i], commitments[i], services[i], timestamps[i]);
            totalAmount += amounts[i];
        }

        vm.expectRevert(HumanIDPayments.IncorrectTotalAmount.selector);
        vm.prank(user1);
        payments.batchPay{value: totalAmount - 1 wei}(commitments, services, amounts, timestamps, signatures);
    }

    function testBatchPayRevertsOnDuplicateCommitment() public {
        uint256 count = 2;
        bytes32[] memory commitments = new bytes32[](count);
        bytes32[] memory services = new bytes32[](count);
        uint256[] memory amounts = new uint256[](count);
        uint256[] memory timestamps = new uint256[](count);
        bytes[] memory signatures = new bytes[](count);

        // Use same commitment twice
        bytes32 commitment = keccak256("secret1");
        commitments[0] = commitment;
        commitments[1] = commitment;

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < count; i++) {
            services[i] = keccak256(abi.encode("service", i));
            amounts[i] = (i + 1) * 1 ether;
            timestamps[i] = block.timestamp;
            signatures[i] = signPayment(amounts[i], commitments[i], services[i], timestamps[i]);
            totalAmount += amounts[i];
        }

        vm.expectRevert(HumanIDPayments.PaymentAlreadyExists.selector);
        vm.prank(user1);
        payments.batchPay{value: totalAmount}(commitments, services, amounts, timestamps, signatures);
    }

    function testBatchPayRevertsOnInvalidSignature() public {
        uint256 count = 2;
        bytes32[] memory commitments = new bytes32[](count);
        bytes32[] memory services = new bytes32[](count);
        uint256[] memory amounts = new uint256[](count);
        uint256[] memory timestamps = new uint256[](count);
        bytes[] memory signatures = new bytes[](count);

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < count; i++) {
            commitments[i] = keccak256(abi.encode("secret", i));
            services[i] = keccak256(abi.encode("service", i));
            amounts[i] = (i + 1) * 1 ether;
            timestamps[i] = block.timestamp;
            
            if (i == 1) {
                // Use invalid signature for second payment
                uint256 wrongKey = 0xBAD;
                bytes32 messageHash = keccak256(
                    abi.encode(amounts[i], commitments[i], services[i], block.chainid, timestamps[i])
                );
                bytes32 ethSignedHash = keccak256(
                    abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
                );
                (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
                signatures[i] = abi.encodePacked(r, s, v);
            } else {
                signatures[i] = signPayment(amounts[i], commitments[i], services[i], timestamps[i]);
            }
            totalAmount += amounts[i];
        }

        vm.expectRevert(HumanIDPayments.InvalidSignature.selector);
        vm.prank(user1);
        payments.batchPay{value: totalAmount}(commitments, services, amounts, timestamps, signatures);
    }

    // ============================================
    // refund() Tests
    // ============================================

    function testRefund() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 balanceBefore = user1.balance;

        uint256 refundTimestamp = block.timestamp;
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        vm.expectEmit(true, true, false, true);
        emit RefundIssued(commitment, user1, amount);

        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, amount);

        (, , , , , bool refunded) = payments.payments(commitment);
        assertTrue(refunded);
    }

    function testRefundRevertsOnNonExistentPayment() public {
        bytes32 commitment = keccak256("secret1");
        uint256 refundTimestamp = block.timestamp;
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        vm.expectRevert(HumanIDPayments.PaymentDoesNotExist.selector);
        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);
    }

    function testRefundRevertsOnAlreadyRefunded() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 refundTimestamp = block.timestamp;
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);

        vm.expectRevert(HumanIDPayments.AlreadyRefunded.selector);
        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);
    }

    function testRefundRevertsOnTimestampInFuture() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 refundTimestamp = block.timestamp + 1;
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        vm.expectRevert(HumanIDPayments.TimestampInFuture.selector);
        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);
    }

    function testRefundRevertsOnSignatureTooOld() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = 1;
        vm.warp(paymentTimestamp);

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 oldRefundTimestamp = 1;
        vm.warp(oldRefundTimestamp);

        // Warp time forward to 10 minutes + 1 second (more than 10 minutes)
        vm.warp(oldRefundTimestamp + 10 minutes + 1);

        // Sign refund with old timestamp (signature will be valid but timestamp will be too old)
        bytes memory refundSignature = signRefund(commitment, oldRefundTimestamp);

        // Now try to use the old refund signature - it should be too old
        vm.expectRevert(HumanIDPayments.SignatureTooOld.selector);
        vm.prank(user1);
        payments.refund(commitment, oldRefundTimestamp, refundSignature);
    }

    function testRefundAcceptsExact365DaysOldSignature() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 refundTimestamp = block.timestamp;
        uint256 balanceBefore = user1.balance;

        // Warp time forward to exactly 365 days
        vm.warp(block.timestamp + 365 days);

        // Sign with timestamp exactly 365 days old (should still be valid)
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, refundSignature);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, amount);
        
        (, , , , , bool refunded) = payments.payments(commitment);
        assertTrue(refunded);
    }

    function testRefundRevertsOnInvalidSignature() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 refundTimestamp = block.timestamp;

        // Create signature with wrong private key
        uint256 wrongKey = 0xBAD;
        bytes32 messageHash = keccak256(abi.encode(commitment, block.chainid, refundTimestamp));
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);

        vm.expectRevert(HumanIDPayments.InvalidSignature.selector);
        vm.prank(user1);
        payments.refund(commitment, refundTimestamp, badSignature);
    }

    // ============================================
    // Admin Function Tests
    // ============================================

    function testForceRefund() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        uint256 balanceBefore = user1.balance;

        vm.expectEmit(true, true, false, true);
        emit RefundIssuedByAdmin(commitment, user1, amount);

        payments.forceRefund(commitment);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, amount);

        (, , , , , bool refunded) = payments.payments(commitment);
        assertTrue(refunded);
    }

    function testForceRefundRevertsOnNonAdmin() public {
        bytes32 commitment = keccak256("secret1");

        vm.expectRevert();
        vm.prank(user1);
        payments.forceRefund(commitment);
    }

    function testForceRefundRevertsOnNonExistentPayment() public {
        bytes32 commitment = keccak256("secret1");

        vm.expectRevert(HumanIDPayments.PaymentDoesNotExist.selector);
        payments.forceRefund(commitment);
    }

    function testForceRefundRevertsOnAlreadyRefunded() public {
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, paymentTimestamp, paymentSignature);

        payments.forceRefund(commitment);

        vm.expectRevert(HumanIDPayments.AlreadyRefunded.selector);
        payments.forceRefund(commitment);
    }

    function testWithdraw() public {
        uint256 depositAmount = 5 ether;
        vm.deal(address(payments), depositAmount);

        uint256 withdrawAmount = 2 ether;
        uint256 balanceBefore = address(this).balance;

        vm.expectEmit(true, true, false, true);
        emit AdminWithdrawal(address(this), address(this), withdrawAmount);

        payments.withdraw(withdrawAmount);

        uint256 balanceAfter = address(this).balance;
        assertEq(balanceAfter - balanceBefore, withdrawAmount);
        assertEq(address(payments).balance, depositAmount - withdrawAmount);
    }

    function testWithdrawRevertsOnInsufficientBalance() public {
        uint256 depositAmount = 1 ether;
        vm.deal(address(payments), depositAmount);

        vm.expectRevert(HumanIDPayments.InsufficientBalance.selector);
        payments.withdraw(2 ether);
    }

    function testWithdrawRevertsOnNonAdmin() public {
        vm.expectRevert();
        vm.prank(user1);
        payments.withdraw(1 ether);
    }

    function testWithdrawTo() public {
        uint256 depositAmount = 5 ether;
        vm.deal(address(payments), depositAmount);

        uint256 withdrawAmount = 2 ether;
        uint256 balanceBefore = user2.balance;

        vm.expectEmit(true, true, false, true);
        emit AdminWithdrawal(address(this), user2, withdrawAmount);

        payments.withdrawTo(withdrawAmount, payable(user2));

        uint256 balanceAfter = user2.balance;
        assertEq(balanceAfter - balanceBefore, withdrawAmount);
        assertEq(address(payments).balance, depositAmount - withdrawAmount);
    }

    function testWithdrawToRevertsOnZeroAddress() public {
        vm.expectRevert(HumanIDPayments.InvalidRecipient.selector);
        payments.withdrawTo(1 ether, payable(address(0)));
    }

    function testWithdrawToRevertsOnInsufficientBalance() public {
        uint256 depositAmount = 1 ether;
        vm.deal(address(payments), depositAmount);

        vm.expectRevert(HumanIDPayments.InsufficientBalance.selector);
        payments.withdrawTo(2 ether, payable(user2));
    }

    function testWithdrawToRevertsOnNonAdmin() public {
        vm.expectRevert();
        vm.prank(user1);
        payments.withdrawTo(1 ether, payable(user2));
    }

    function testWithdrawAll() public {
        uint256 depositAmount = 5 ether;
        vm.deal(address(payments), depositAmount);

        uint256 balanceBefore = address(this).balance;

        vm.expectEmit(true, true, false, true);
        emit AdminWithdrawal(address(this), address(this), depositAmount);

        payments.withdrawAll();

        uint256 balanceAfter = address(this).balance;
        assertEq(balanceAfter - balanceBefore, depositAmount);
        assertEq(address(payments).balance, 0);
    }

    function testWithdrawAllRevertsOnNoBalance() public {
        vm.expectRevert(HumanIDPayments.NoBalanceToWithdraw.selector);
        payments.withdrawAll();
    }

    function testWithdrawAllRevertsOnNonAdmin() public {
        vm.expectRevert();
        vm.prank(user1);
        payments.withdrawAll();
    }

    function testSetOracleAddress() public {
        address newOracle = makeAddr("newOracle");

        vm.expectEmit(true, true, false, true);
        emit OracleUpdated(oracle, newOracle);

        payments.setOracleAddress(newOracle);

        assertEq(payments.oracleAddress(), newOracle);
    }

    function testSetOracleAddressRevertsOnZeroAddress() public {
        vm.expectRevert(HumanIDPayments.InvalidOracleAddress.selector);
        payments.setOracleAddress(address(0));
    }

    function testSetOracleAddressRevertsOnNonAdmin() public {
        address newOracle = makeAddr("newOracle");

        vm.expectRevert();
        vm.prank(user1);
        payments.setOracleAddress(newOracle);
    }

    // ============================================
    // Utility Function Tests
    // ============================================

    function testDeposit() public {
        uint256 depositAmount = 5 ether;

        vm.expectEmit(true, false, false, true);
        emit FundsDeposited(user1, depositAmount);

        vm.prank(user1);
        payments.deposit{value: depositAmount}();

        assertEq(address(payments).balance, depositAmount);
    }

    function testDepositRevertsOnZeroAmount() public {
        vm.expectRevert(HumanIDPayments.MustSendETH.selector);
        vm.prank(user1);
        payments.deposit();
    }

    function testReceive() public {
        uint256 depositAmount = 5 ether;

        vm.expectEmit(true, false, false, true);
        emit FundsDeposited(user1, depositAmount);

        vm.prank(user1);
        (bool success, ) = address(payments).call{value: depositAmount}("");

        assertTrue(success);
        assertEq(address(payments).balance, depositAmount);
    }

    function testGetBalance() public {
        uint256 depositAmount = 5 ether;
        vm.deal(address(payments), depositAmount);

        assertEq(payments.getBalance(), depositAmount);
    }

    // ============================================
    // Integration Tests
    // ============================================

    function testMultiplePaymentsAndRefunds() public {
        uint256 count = 5;

        for (uint256 i = 0; i < count; i++) {
            bytes32 commitment = keccak256(abi.encode("secret", i));
            bytes32 service = keccak256(abi.encode("service", i));
            uint256 amount = (i + 1) * 1 ether;
            uint256 timestamp = block.timestamp;

            bytes memory signature = signPayment(amount, commitment, service, timestamp);

            vm.prank(user1);
            payments.pay{value: amount}(commitment, service, timestamp, signature);
        }

        // Refund every other payment
        for (uint256 i = 0; i < count; i += 2) {
            bytes32 commitment = keccak256(abi.encode("secret", i));
            uint256 refundTimestamp = block.timestamp;
            bytes memory refundSignature = signRefund(commitment, refundTimestamp);

            vm.prank(user1);
            payments.refund(commitment, refundTimestamp, refundSignature);
        }

        // Verify refund status
        for (uint256 i = 0; i < count; i++) {
            bytes32 commitment = keccak256(abi.encode("secret", i));
            (, , , , , bool refunded) = payments.payments(commitment);

            if (i % 2 == 0) {
                assertTrue(refunded);
            } else {
                assertFalse(refunded);
            }
        }
    }

    function testPaymentWorksAfterOracleUpdate() public {
        // Create new oracle
        uint256 newOraclePrivateKey = 0xBEEF;
        address newOracle = vm.addr(newOraclePrivateKey);

        // Update oracle
        payments.setOracleAddress(newOracle);

        // Create payment with new oracle
        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 timestamp = block.timestamp;

        bytes32 messageHash = keccak256(
            abi.encode(amount, commitment, service, block.chainid, timestamp)
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newOraclePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(user1);
        payments.pay{value: amount}(commitment, service, timestamp, signature);

        (, , , address sender, , ) = payments.payments(commitment);
        assertEq(sender, user1);
    }

    // ============================================
    // Reentrancy Protection Tests
    // ============================================

    function testRefundReentrancyProtection() public {
        // Deploy malicious contract
        MaliciousReceiver attacker = new MaliciousReceiver(payments);
        uint256 initialBalance = 10 ether;
        vm.deal(address(attacker), initialBalance);

        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        // Attacker makes payment using its own balance (spends 1 ether from attacker's balance)
        vm.prank(address(attacker));
        attacker.makePayment{value: amount}(commitment, service, paymentTimestamp, paymentSignature);
        
        // Attacker should have 10 ether - 1 ether = 9 ether after payment
        assertEq(address(attacker).balance, initialBalance - amount);

        uint256 refundTimestamp = block.timestamp;
        bytes memory refundSignature = signRefund(commitment, refundTimestamp);

        // Attacker attempts reentrancy attack
        // The refund() function sets refunded=true before the external call (CEI pattern)
        // When receive() tries to call refund() again, it will revert with AlreadyRefunded
        // This revert will cause the call() to return false, which will revert the entire refund
        // However, this demonstrates that reentrancy is prevented - the refunded flag is checked first
        
        // The reentrancy attempt will cause the refund to revert
        // This is expected behavior - the contract protects against reentrancy
        vm.expectRevert(HumanIDPayments.TransferFailed.selector);
        attacker.attemptReentrancy(commitment, refundTimestamp, refundSignature);
        
        // Verify payment is NOT marked as refunded (because the transaction reverted)
        // Note: Due to CEI pattern, the refunded flag is set before the external call
        // But if the call fails, the entire transaction reverts, so the state change is rolled back
        (, , , , , bool refunded) = payments.payments(commitment);
        assertFalse(refunded);
        
        // Attacker should still have 9 ether (refund didn't complete)
        assertEq(address(attacker).balance, initialBalance - amount);
    }

    function testForceRefundReentrancyProtection() public {
        // Deploy malicious contract
        MaliciousReceiver attacker = new MaliciousReceiver(payments);
        uint256 initialBalance = 10 ether;
        vm.deal(address(attacker), initialBalance);

        bytes32 commitment = keccak256("secret1");
        bytes32 service = keccak256("service1");
        uint256 amount = 1 ether;
        uint256 paymentTimestamp = block.timestamp;

        bytes memory paymentSignature = signPayment(amount, commitment, service, paymentTimestamp);

        // Attacker makes payment using its own balance (spends 1 ether from attacker's balance)
        // Call without value so the contract uses its own balance
        vm.prank(address(attacker));
        attacker.makePayment{value: amount}(commitment, service, paymentTimestamp, paymentSignature);
        
        // Attacker should have 10 ether - 1 ether = 9 ether after payment
        assertEq(address(attacker).balance, initialBalance - amount);

        // Admin force refunds
        // The MaliciousReceiver's receive() will try to reenter by calling refund()
        // But since the refunded flag is set before the external call (CEI pattern),
        // the reentrancy attempt will fail with AlreadyRefunded, causing receive() to revert
        // This will cause the call() to return false, reverting the entire forceRefund
        // So the refund should fail, and the attacker should still have 9 ether
        vm.expectRevert(HumanIDPayments.TransferFailed.selector);
        payments.forceRefund(commitment);

        // Verify attacker did NOT receive the refund (should still have 9 ether)
        assertEq(address(attacker).balance, initialBalance - amount);
        
        // Verify payment is NOT marked as refunded (transaction reverted)
        (, , , , , bool refunded) = payments.payments(commitment);
        assertFalse(refunded);
    }

    // Required to receive ETH
    receive() external payable {}
}

// Malicious contract for reentrancy tests
contract MaliciousReceiver {
    HumanIDPayments public payments;
    bool public attacked;
    bytes32 public storedCommitment;
    uint256 public storedRefundTimestamp;
    bytes public storedRefundSignature;

    constructor(HumanIDPayments _payments) {
        payments = _payments;
    }

    function makePayment(
        bytes32 commitment,
        bytes32 service,
        uint256 timestamp,
        bytes memory signature
    ) external payable {
        payments.pay{value: msg.value}(commitment, service, timestamp, signature);
    }

    function attemptReentrancy(
        bytes32 commitment,
        uint256 timestamp,
        bytes memory signature
    ) external {
        // Store values for reentrancy attempt
        storedCommitment = commitment;
        storedRefundTimestamp = timestamp;
        storedRefundSignature = signature;
        // This will trigger receive() which will try to reenter
        payments.refund(commitment, timestamp, signature);
    }

    receive() external payable {
        // Try to call refund again (will fail because refunded flag is already set)
        if (!attacked) {
            attacked = true;
            // Attempt reentrancy - this should revert with AlreadyRefunded
            // The refunded flag check happens first, preventing reentrancy
            // This revert will bubble up and cause the original call() to return false
            payments.refund(storedCommitment, storedRefundTimestamp, storedRefundSignature);
        }
    }
}
