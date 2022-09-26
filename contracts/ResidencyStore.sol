// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Hub.sol";
import "./PairingAndProof.sol";

contract ResidencyStore is Ownable  {
    
    mapping(address => bool) public usResidency; // e.g., 0x123... => true
    mapping(uint256 => bool) public footprints;

    Hub hub;
    event USResidency(address userAddr, bool usResidency);

    constructor(address hub_) {
        hub = Hub(hub_);
    }


    // It is useful to separate this from the prove() function which is changes state, so that somebody can call this off-chain as a view function.
    // Then, they can maintain their own off-chain list of footprints and verified address 
    function proofIsValid(Proof calldata proof, uint[] calldata input) public view returns (bool isValid) {
        require(uint256(uint160(msg.sender)) == input[1], "Second public argument of proof must be your address");
        require(input[2] == 1144726183143482297049508718223886886488380117896, "Proof must come from authority address"); // This is integer representation of the address 0xc88... 
        require(input[3] == 59257896596766011586056368680640813178757414818545978794498057233032252153570, "Footprint is made from the wrong salt"); //keccak256("IsFromUS")
        require(!footprints[input[4]], "One person can only verify once");
        require(input[5] == 2, "Credentials do not have US as country code"); // 2 is prime that represents USA because USA is #2
        require(hub.verifyProof("USResident", proof, input), "Failed to verify proof");
        return true;
    }

    /// @param proof PairingAndProof.sol Proof struct
    /// @param input The public inputs to the proof, in ZoKrates' format
    function prove(Proof calldata proof, uint[] calldata input) public onlyOwner {
        require(proofIsValid(proof, input));
        footprints[input[4]] = true;
        usResidency[msg.sender] = true;
        emit USResidency(msg.sender, true);
    }

}
