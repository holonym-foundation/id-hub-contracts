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
    function setResidesInUS(Proof calldata proof, uint[] calldata input) public onlyOwner {
        console.log(input[0], input[1], input[2]);
        require(input[2] == 2, "Credentials do not have US as country code"); // 2 is prime that represents USA because USA is #2
        usResidency[msg.sender] = true;
        emit USResidency(msg.sender, true);
        require(hub.verifyProof("USResident", proof, input));
    }

}
