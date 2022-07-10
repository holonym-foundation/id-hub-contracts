// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Adds a verified crendential to the user
contract CredentialAdder {
    using ECDSA for bytes32;
    mapping(address => bytes32) encryptedMerkleRoots;
    address constant authority = 0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388;

    constructor(){
        
    }

    function isForSender(bytes memory message) public view returns (bool forSender) {
        // console.logBytes(sliceBytesMemory(message, 0, 20));
        // console.logBytes(bytes(abi.encodePacked(msg.sender)));
        // The only way to check bytes are equal is by checking their hashes at present (to my knowledge):
        return keccak256(
                    sliceBytesMemory(message, 0, 20)
                ) == 
                keccak256(
                    abi.encodePacked(msg.sender)
                );
    }
    // address constant verifyContract = 
    // function isFromIssuer(bytes32 hashed, bytes memory signature, address issuer) public view returns (bool) {
    //     // bytes32 hashed = keccak256(msg);
    //     console.log("issuer");
    //     console.log(hashed.toEthSignedMessageHash().recover(signature));
    //     console.logBytes32(hashed);
    //     return hashed.toEthSignedMessageHash().recover(signature) == issuer;
    // }


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

    // Copied from WTFUtils by me
    // This could be more efficient by not copying the whole thing, rather just the parts that matter
    function sliceBytesMemory(bytes memory input_, uint256 start_, uint256 end_) public view returns (bytes memory r) {
        uint256 len_ = input_.length;
        r = new bytes(len_);
        
        assembly {
            // Use identity to copy data
            if iszero(staticcall(not(0), 0x04, add(input_, 0x20), len_, add(r, 0x20), len_)) {
                revert(0, 0)
            }
        }
        return destructivelySliceBytesMemory(r, start_, end_);
    }
    
    function destructivelySliceBytesMemory(bytes memory m, uint256 start, uint256 end) public pure returns (bytes memory r) {
        require(start < end, "index start must be less than inded end");
        assembly {
            let offset := add(start, 0x20) //first 0x20 bytes of bytes type is length (no. of bytes)
            r := add(m, start)
            mstore(r, sub(end, start))
        }
    }

    function addCredential(bytes memory credential, uint8 v, bytes32 r, bytes32 s) public {
        require(isFromIssuer(credential, v,r,s, authority)); //for now, only use authority as issuer, later will allow any issuer
        // require(first bytes is recipient)
        // require()
        // require(zksnark that next bytes is issuer, encrypted, etc)
        // require()
    }
}
