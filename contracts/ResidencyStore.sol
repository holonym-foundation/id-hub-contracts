// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Hub.sol";
import "./PairingAndProof.sol";

contract ResidencyStore is Ownable  {
    
    mapping(address => bool) public usResidency; // e.g., 0x123... => true
    Hub hub;
    event USResidency(address userAddr, bool usResidency);

    constructor(address hub_) {
        hub = Hub(hub_);
    }
    /// @param proof PairingAndProof.sol Proof struct
    /// @param input The public inputs to the proof, in ZoKrates' format
    function prove(Proof calldata proof, uint[] calldata input) public onlyOwner {
        require(uint256(uint160(msg.sender)) == input[1], "Second public argument of proof must be your address");
        require(input[2] == 1144726183143482297049508718223886886488380117896, "Proof must come from authority address"); // This is integer representation of the address 0xc88... 
        require(input[3] == 2, "Credentials do not have US as country code"); // 2 is prime that represents USA because USA is #2
        require(hub.verifyProof("USResident", proof, input), "Failed to verify proof");
        usResidency[msg.sender] = true;
        emit USResidency(msg.sender, true);
    }

}
