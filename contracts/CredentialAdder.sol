// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./AssertLeafFromAddressVerifier.sol";

// Adds a verified crendential to the user
contract CredentialAdder {    
    using ECDSA for bytes32;
    bytes32[] public leaves;
    AssertLeafFromAddressVerifier verifier;
    
    constructor(address verifierAddr){
        verifier = AssertLeafFromAddressVerifier(verifierAddr);
    }

    // Copied and slightly modified from from https://blog.ricmoo.com/verifying-messages-in-solidity-50a94f82b2ca
    function isFromIssuer(bytes memory message, uint8 v, bytes32 r, bytes32 s, address issuer) public pure returns (bool fromIssuer) {
        // The message header; we will fill in the length next
        bytes memory header = bytes("\x19Ethereum Signed Message:\n000000");
        uint256 lengthOffset;
        uint256 length;
        assembly {
        // The first word of a string is its length
        length := mload(message)
        // The beginning of the base-10 message length in the prefix
        lengthOffset := add(header, 57)
        }
        // Maximum length we support
        require(length <= 999999);
        // The length of the message's length in base-10
        uint256 lengthLength = 0;
        // The divisor to get the next left-most message length digit
        uint256 divisor = 100000;
        // Move one digit of the message length to the right at a time
        while (divisor != 0) {
        // The place value at the divisor
        uint256 digit = length / divisor;
        if (digit == 0) {
            // Skip leading zeros
            if (lengthLength == 0) {
            divisor /= 10;
            continue;
            }
        }
        // Found a non-zero digit or non-leading zero digit
        lengthLength++;
        // Remove this digit from the message length's current value
        length -= digit * divisor;
        // Shift our base-10 divisor over
        divisor /= 10;
        
        // Convert the digit to its ASCII representation (man ascii)
        digit += 0x30;
        // Move to the next character and write the digit
        lengthOffset++;
        assembly {
            mstore8(lengthOffset, digit)
        }
        }
        // The null string requires exactly 1 zero (unskip 1 leading 0)
        if (lengthLength == 0) {
        lengthLength = 1 + 0x19 + 1;
        } else {
        lengthLength += 1 + 0x19;
        }
        // Truncate the tailing zeros from the header
        assembly {
        mstore(header, lengthLength)
        }
        // Perform the elliptic curve recover operation
        bytes32 check = keccak256(bytes.concat(header, message));
        return ecrecover(check, v, r, s) == issuer;
    }


    // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
    function bytesToAddress(bytes memory b_) private pure returns (address addr) {
        assembly {
            addr := mload(add(b_,20))
        } 
    }
    // Adds a leaf after checking it contains a valid credential
    function addLeaf(bytes calldata leaf, address issuer, uint8 v, bytes32 r, bytes32 s, AssertLeafFromAddressVerifier.Proof memory proof, uint[13] memory input) public {
        address addressFromProof = bytesToAddress(
            bytes.concat(
                abi.encodePacked(uint32(input[8])), 
                abi.encodePacked(uint32(input[9])), 
                abi.encodePacked(uint32(input[10])), 
                abi.encodePacked(uint32(input[11])), 
                abi.encodePacked(uint32(input[12])
                )
            )
        );
        require(addressFromProof == issuer, "credentials must be proven to start with the issuer's address");
        require(isFromIssuer(leaf, v,r,s, issuer), "credentials must be signed by the issuer"); 
        require(verifier.verifyTx(proof, input), "zkSNARK failed");   
        _addLeaf(leaf);
    }
    // Blindly adds a leaf (should be private)
    function _addLeaf(bytes calldata leaf) private {
        leaves.push(bytes32(leaf));
    }
    function getLeaves() public view returns (bytes32[] memory) {
        return leaves;
    }
}
