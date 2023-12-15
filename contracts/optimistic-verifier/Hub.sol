// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract Hub {
    using ECDSA for bytes32;

    address verifier;
    mapping(uint => bool) public usedNullifiers;
    /// Mapping of (user, circuit) identifiers to the corresponding SBT value which is an array of uints
    mapping(bytes32 => uint[]) public sbtOwners;
    constructor(address v) {
        verifier = v;
    }

    /// Gets an identifier for a (user, circuit) pair. 
    function getIdentifier(address user, bytes32 circuitId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, circuitId));
    }


    /// `circuitId` is the ID of the circuit and also the SBT
    /// `proofIPFSCID` is a currently unused parameter set to the empty string. It can be used to check the proof oneself instead of trusting the verifier.
    /// `sbtReciever` is the address the verifier specifies to recieve the SBT. 
    /// `nullifier` is an optional field (set to 0 if unused) which prevents the same ID from being used for >1 proof. Again this is given by the verifier but can be checked if the Verifier posts the proof to IPFS
    /// `publicValues` are the proofs' public inputs and outputs. They are stored with the SBT. Again, these can be checked if the proof is put in IPFS
    function sendSBT(
        bytes32 circuitId,
        string calldata proofIPFSCID,
        address sbtReciever, 
        uint nullifier, 
        uint[] calldata publicValues, 
        bytes memory signature
    ) public {
        bool success = keccak256(
            abi.encodePacked(
                circuitId,
                proofIPFSCID,
                sbtReciever, 
                nullifier,
                publicValues
            )
        )
        .toEthSignedMessageHash()
        .recover(signature) == verifier;
        require(success, "unapproved verifier");

        if(nullifier != 0) {
            require(!usedNullifiers[nullifier], "this is already been proven");
            usedNullifiers[nullifier] = true;
        }
        sbtOwners[getIdentifier(sbtReciever, circuitId)] = publicValues;
    }
}
