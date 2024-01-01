// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./PaidProofV3.sol";
// import "hardhat/console.sol";
struct SBT {
    uint expiry; // A Unix timestamp in the same format as block.timestamp
    uint[] publicValues; // The proof's public values
}
contract Hub is PaidProofV3 {
    using ECDSA for bytes32;

    address verifier;

    mapping(uint => bool) public usedNullifiers;
    /// Mapping of (user, circuit) identifiers to the corresponding SBT timestamp and value which is an array of uints
    mapping(bytes32 => SBT) public sbtOwners;
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
    /// `expiration` is an expiration date the verifier can set.
    /// `customFee` is a fee the verifier can set that the user must pay to submit the transaction.
    /// `nullifier` is an optional field (set to 0 if unused) which prevents the same ID from being used for >1 proof. Again this is given by the verifier but can be checked if the Verifier posts the proof to IPFS
    /// `publicValues` are the proofs' public inputs and outputs. They are stored with the SBT. Again, these can be checked if the proof is put in IPFS
    /// To migrate SBT owners from the previous contract, the initially centralized trusted verifier can simply add them one-by-one
    function sendSBT(
        bytes32 circuitId,
        // string calldata proofIPFSCID,
        uint sbtReciever, 
        uint expiration,
        uint customFee,
        uint nullifier, 
        uint[] calldata publicValues, 
        bytes memory signature
    ) public payable needsCustomFee(customFee) /* needsPayment(circuitId) */ {
        bool success = keccak256(
            abi.encodePacked(
                circuitId,
                // proofIPFSCID,
                sbtReciever, 
                expiration,
                customFee,
                nullifier,
                publicValues,
                block.chainid // Chain ID in signature prevents proof from being replayed on other chains for same native price
            )
        )
        .toEthSignedMessageHash()
        .recover(signature) == verifier;
        require(success, "The Verifier did not sign the provided arguments in the provided order");

        if(nullifier != 0) {
            require(!usedNullifiers[nullifier], "this is already been proven");
            usedNullifiers[nullifier] = true;
        }
        sbtOwners[getIdentifier(address(uint160(sbtReciever)), circuitId)] = SBT(expiration, publicValues);
    }

    /// IMPORTANT: make sure you check the public values such as actionId from this. Someone can forge a proof if you don't check the public values
    /// e.g., by using a different issuer or actionId
    function getSBT(address sbtOwner, bytes32 circuitId) public view returns (SBT memory sbt) {
        SBT memory s = sbtOwners[getIdentifier(sbtOwner, circuitId)];
        require(s.expiry >= block.timestamp, "SBT is expired");
        return s;
    }
}
