// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ResidencyStore is Ownable  {

    mapping(address => bool) public residesInUS; // e.g., 0x123... => true

    // address[] public recordedAddresses;

    event SetUserResidesInUS(address userAddr, bool userResidesInUS);

    /// @param userAddr The user's blockchain address.
    /// @param userResidesInUS Whether the user is a US resident.
    function setResidesInUS(address userAddr, bool userResidesInUS) public onlyOwner {
        residesInUS[userAddr] = userResidesInUS;
        emit SetUserResidesInUS(userAddr, userResidesInUS);
    }

}
