// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./onAddLeaf.verifier.sol";
import "./ProofRouter.sol";
import "./MerkleTree.sol";
// Adds a verified crendential to the user
contract Hub {    
    using ECDSA for bytes32;
    mapping (uint256 => bool) public oldLeafUsed;
    OnAddLeaf oal;

    ProofRouter public router;
    MerkleTree public mt;

    constructor(address routerAdmin_){
        router = new ProofRouter(routerAdmin_);
        oal = new OnAddLeaf(); 
        mt = new MerkleTree(address(this));
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

    function uncheckedUIntToAddress(uint256 u_) private pure returns (address addr) {
        assembly {
            addr := u_
        } 
    }

    // Blindly adds a leaf (should be private)
    function _addLeaf(uint256 leaf) private {
        mt.insertLeaf(leaf);
    }
    
    
    function addLeaf(address issuer, uint8 v, bytes32 r, bytes32 s, Proof memory proof, uint[3] memory input) public {
        address addr = uncheckedUIntToAddress(input[2]);
        uint256 newLeaf = input[1];
        uint256 oldLeaf = input[0];
        require(addr == issuer, "credentials must be proven to start with the issuer's address");
        require(isFromIssuer(abi.encodePacked(oldLeaf), v,r,s, issuer), "leaf must be signed by the issuer"); 
        require(oal.verifyTx(proof, input), "zkSNARK failed");

        require(!oldLeafUsed[oldLeaf], "cannot create more than one new leaf from a signed leaf");
        oldLeafUsed[oldLeaf] = true;   

        _addLeaf(newLeaf);        
    }

    // Encode input using abi.encode to convert fixed-length uint[n] array to bytes
    function verifyProof(string calldata proofType, Proof calldata proof, uint[] calldata input) public view returns (bool) {
        require(mt.rootIsRecent(input[0]), "First public argument of proof must be a recent Merkle Root");
        return router.verifyProof(proofType, proof, input);
    }

    function mostRecentRoot() public view returns (uint256) {
        return mt.mostRecentRoot();
    }

    function getLeaves() public view returns (uint256[] memory) {
        return mt.getLeaves();
    }

    function getLeavesFrom(uint idx) public view returns(uint256[] memory) {
        return mt.getLeavesFrom(idx);
    }
}
