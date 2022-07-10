// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Adds a verified crendential to the user
contract CredentialAdder {
    using ECDSA for bytes32;
    mapping(address => bytes32) encryptedMerkleRoots;
    address constant authority = 0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388;
    // address constant verifyContract = 
    function isFromIssuer(bytes32 msg, bytes memory signature, address issuer) internal pure returns (bool) {
        return msg.toEthSignedMessageHash().recover(signature) == issuer;
    }

    function addCredential(bytes memory credential, bytes memory signature) public {
        require(isFromIssuer(keccak256(credential), signature, authority)); //for now, only use authority as issuer, later will allow any issuer
        // require(first bytes is recipient)
        // require()
        // require(zksnark that next bytes is issuer, encrypted, etc)
        // require()
    }
}
