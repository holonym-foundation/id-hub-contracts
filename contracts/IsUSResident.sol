// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Hub.sol";
import "./PairingAndProof.sol";

contract IsUSResident {
    
    mapping(address => bool) public usResidency; // e.g., 0x123... => true
    mapping(uint256 => bool) public masalaWasUsed;

    Hub hub;
    uint authorityAddress; // Stored as uint instead of address for easy comparison to proof input uints
    event USResidency(address userAddr, bool usResidency);

    constructor(address hub_, address authorityAddress_) {
        hub = Hub(hub_);
        authorityAddress = uint256(uint160(authorityAddress_));
    }


    // It is useful to separate this from the prove() function which is changes state, so that somebody can call this off-chain as a view function.
    // Then, they can maintain their own off-chain list of footprints and verified address 
    function proofIsValid(Proof calldata proof, uint[] calldata input) public view returns (bool isValid) {
        // Checking msg.sender no longer seems very necessary and prevents signature-free interactions. Without it, relayers can submit cross-chain transactions without the user signature. Thus, we are deprecating this check:
        // require(uint256(uint160(msg.sender)) == input[1], "Second public argument of proof must be your address");

        require(input[2] == authorityAddress, "Proof must come from authority address"); // This is integer representation of the address 0xc88... 
        require(input[3] == 18450029681611047275023442534946896643130395402313725026917000686233641593164, "Footprint is made from the wrong salt"); //poseidon("IsFromUS")
        require(!masalaWasUsed[input[4]], "One person can only verify once");
        require(input[5] == 2, "Credentials do not have US as country code"); // 2 is prime that represents USA because USA is #2
        require(hub.verifyProof("USResident", proof, input), "Failed to verify proof");
        return true;
    }

    /// @param proof PairingAndProof.sol Proof struct
    /// @param input The public inputs to the proof, in ZoKrates' format
    function prove(Proof calldata proof, uint[] calldata input) public {
        require(proofIsValid(proof, input));
        masalaWasUsed[input[4]] = true;
        usResidency[address(uint160(input[1]))] = true; //
        emit USResidency(msg.sender, true);
    }

}
