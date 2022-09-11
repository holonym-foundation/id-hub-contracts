// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./AddLeafBig.sol";
import "./AddLeafSmall.sol";
import "./ProofRouter.sol";
// Adds a verified crendential to the user
contract Hub {    
    using ECDSA for bytes32;
    bytes32[] public leaves;
    mapping (bytes32 => bool) public leafExists;
    mapping (bytes32 => bool) public oldLeafUsed;
    AddLeafBig alb;
    AddLeafSmall als;

    ProofRouter router;
    
    constructor(address alb_, address als_){
        alb = AddLeafBig(alb_);
        als = AddLeafSmall(als_);
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

    function getLeaves() public view returns (bytes32[] memory) {
        return leaves;
    }

    // Blindly adds a leaf (should be private)
    function _addLeaf(bytes calldata leaf) private {
        bytes32 l = bytes32(leaf);
        leaves.push(l);
        leafExists[l] = true;
    }
    function _addLeaf(bytes32 l) private {
        leaves.push(l);
        leafExists[l] = true;
    }
    
    // Adds a leaf after checking it contains a valid credential
    function addLeafSmall(address issuer, uint8 v, bytes32 r, bytes32 s, AddLeafSmall.Proof memory proof, uint[21] memory input) public {
        bytes memory oldLeafFromProof = 
            bytes.concat(
                abi.encodePacked(uint32(input[0])), 
                abi.encodePacked(uint32(input[1])), 
                abi.encodePacked(uint32(input[2])), 
                abi.encodePacked(uint32(input[3])), 
                abi.encodePacked(uint32(input[4])),
                abi.encodePacked(uint32(input[5])),
                abi.encodePacked(uint32(input[6])),
                abi.encodePacked(uint32(input[7]))
                );

        bytes32 newLeafFromProof = bytes32(
            bytes.concat(
                abi.encodePacked(uint32(input[8])), 
                abi.encodePacked(uint32(input[9])), 
                abi.encodePacked(uint32(input[10])), 
                abi.encodePacked(uint32(input[11])), 
                abi.encodePacked(uint32(input[12])),
                abi.encodePacked(uint32(input[13])),
                abi.encodePacked(uint32(input[14])),
                abi.encodePacked(uint32(input[15]))
            )
        );
        address addressFromProof = bytesToAddress(
            bytes.concat(
                abi.encodePacked(uint32(input[16])), 
                abi.encodePacked(uint32(input[17])), 
                abi.encodePacked(uint32(input[18])), 
                abi.encodePacked(uint32(input[19])), 
                abi.encodePacked(uint32(input[20])
                )
            )
        );
        require(addressFromProof == issuer, "credentials must be proven to start with the issuer's address");
        require(isFromIssuer(oldLeafFromProof, v,r,s, issuer), "leaf must be signed by the issuer"); 
        require(als.verifyTx(proof, input), "zkSNARK failed");

        bytes32 olfp = bytes32(oldLeafFromProof);
        require(!oldLeafUsed[olfp], "cannot create more than one leaf from a signed leaf");
        oldLeafUsed[olfp] = true;   

        _addLeaf(newLeafFromProof);        
    }

    // Adds a leaf after checking it contains a valid credential
    function addLeafBig(address issuer, uint8 v, bytes32 r, bytes32 s, AddLeafBig.Proof memory proof, uint[21] memory input) public {
        bytes memory oldLeafFromProof = 
            bytes.concat(
                abi.encodePacked(uint32(input[0])), 
                abi.encodePacked(uint32(input[1])), 
                abi.encodePacked(uint32(input[2])), 
                abi.encodePacked(uint32(input[3])), 
                abi.encodePacked(uint32(input[4])),
                abi.encodePacked(uint32(input[5])),
                abi.encodePacked(uint32(input[6])),
                abi.encodePacked(uint32(input[7]))
                
            );
        bytes32 newLeafFromProof = bytes32(
            bytes.concat(
                abi.encodePacked(uint32(input[0])), 
                abi.encodePacked(uint32(input[1])), 
                abi.encodePacked(uint32(input[2])), 
                abi.encodePacked(uint32(input[3])), 
                abi.encodePacked(uint32(input[4])),
                abi.encodePacked(uint32(input[5])),
                abi.encodePacked(uint32(input[6])),
                abi.encodePacked(uint32(input[7]))
                )
        );
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
        require(isFromIssuer(oldLeafFromProof, v,r,s, issuer), "leaf must be signed by the issuer"); 
        require(alb.verifyTx(proof, input), "zkSNARK failed");   

        bytes32 olfp = bytes32(oldLeafFromProof);
        require(!oldLeafUsed[olfp], "cannot create more than one leaf from a signed leaf");
        oldLeafUsed[olfp] = true;

        _addLeaf(newLeafFromProof);
    }

    /* This function was tested and works, but it will be moved to another contract. This should be one of many supported proof types. 
     * Since there will be many proof types, it makes sense to have this in a separate contract for proving, where this contract is for adding. */
    // // Adds a leaf after checking it contains a valid credential
    // function proveIHaveCredential(AssertLeafContainsCredsVerifier.Proof memory proof, uint[25] memory input) public returns (bytes memory credential) {
    //     bytes32 leafFromProof = bytes32(
    //         bytes.concat(
    //             abi.encodePacked(uint32(input[0])), 
    //             abi.encodePacked(uint32(input[1])), 
    //             abi.encodePacked(uint32(input[2])), 
    //             abi.encodePacked(uint32(input[3])), 
    //             abi.encodePacked(uint32(input[4])),
    //             abi.encodePacked(uint32(input[5])),
    //             abi.encodePacked(uint32(input[6])),
    //             abi.encodePacked(uint32(input[7]))
    //             )
    //     );

    //     bytes memory credsFromProof = bytes.concat(
    //             abi.encodePacked(uint32(input[13])), 
    //             abi.encodePacked(uint32(input[14])), 
    //             abi.encodePacked(uint32(input[15])), 
    //             abi.encodePacked(uint32(input[16])), 
    //             abi.encodePacked(uint32(input[17])),
    //             abi.encodePacked(uint32(input[18])),
    //             abi.encodePacked(uint32(input[19]))
    //         );

    //     address antiFrontrunningAddressFromProof = bytesToAddress(
    //         bytes.concat(
    //             abi.encodePacked(uint32(input[20])), 
    //             abi.encodePacked(uint32(input[21])), 
    //             abi.encodePacked(uint32(input[22])), 
    //             abi.encodePacked(uint32(input[23])), 
    //             abi.encodePacked(uint32(input[24]))
    //             )
    //     );

    //     require(_msgSender() == antiFrontrunningAddressFromProof, "msgSender is not antiFrontrunningAddress");
    //     require(leafExists[leafFromProof], "Leaf was not found");
    //     require(alccV.verifyTx(proof, input), "zkSNARK failed");   
    //     return credsFromProof;
    // }

    // TODO: test this returns false when proof fails
    function verifyProof(string calldata proofType, bytes calldata proofAsBytes) public view returns (bool) {
        return router.verifyProof(proofType, proofAsBytes);
    }

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }
}
