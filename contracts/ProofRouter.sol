// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVerifier.sol";
// Adds a verified crendential to the user
contract ProofRouter is Ownable{    
    mapping (string => address) public routes;

    constructor(){

    }

    function addRoute(string memory name, address destination) public onlyOwner {
        // Check that it is uninitialized (for security so centralized owner cannot overwrite old routes, only add new ones)
        require(routes[name] == address(0x0));
        routes[name] = destination;
    }

    // How to get Proof struct to proofParams: abi.encode. Verifier contract can decode it using abi.decode https://medium.com/coinmonks/abi-encode-and-decode-using-solidity-2d372a03e110
    function verifyProof(string calldata name, bytes calldata proofParams) public view returns (bool) {
        require(routes[name] != address(0x0));
        IVerifier v = IVerifier(routes[name]);
        return v.verifyFromBytes(proofParams);
    }    
}
