// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Hub.sol";
import "./PairingAndProof.sol";

contract AntiSybilStore {
    // Stores all used footprints
    mapping(uint256 => bool) public footprints;
    // When *address* verifies they're unique for *actionId*, keccak256(address, actionId) will be stored as true:
    mapping(bytes32 => bool) verifications;
    // And an event will be emitted:
    event Uniqueness(address userAddr, uint actionId);

    Hub hub;
    uint authorityAddress; // Stored as uint instead of address for easy comparison to proof input uints

    constructor(address hub_, address authorityAddress_) {
        hub = Hub(hub_);
        authorityAddress = uint256(uint160(authorityAddress_));
    }

    function isUniqueForAction(address addr, uint actionId) public view returns (bool unique) {
        return verifications[keccak256(abi.encodePacked(addr, actionId))];
    }

    // It is useful to separate this from the prove() function which is changes state, so that somebody can call this off-chain as a view function.
    // Then, they can maintain their own off-chain list of footprints and verified address 
    function proofIsValid(Proof calldata proof, uint[] calldata input) public view returns (bool isValid) {
        require(uint256(uint160(msg.sender)) == input[1], "Second public argument of proof must be your address");
        require(input[2] == authorityAddress, "Proof must come from authority address"); // This is integer representation of the address 0xc88... 
        require(!footprints[input[4]], "One person can only verify once");
        require(hub.verifyProof("SybilResistance", proof, input), "Failed to verify proof");
        return true;
    }

    /// @param proof PairingAndProof.sol Proof struct
    /// @param input The public inputs to the proof, in ZoKrates' format
    function prove(Proof calldata proof, uint[] calldata input) public {
        require(proofIsValid(proof, input));
        footprints[input[4]] = true; //input[4] is address
        bytes32 commit = keccak256(abi.encodePacked(msg.sender, input[3])); //input[3] is actionId
        console.logBytes32(commit);
        verifications[commit] = true;
        emit Uniqueness(msg.sender, input[3]);
    }

}
