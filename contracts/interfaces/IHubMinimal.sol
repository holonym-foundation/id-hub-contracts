// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Minimal interface for Hub that just exposes the one function that most proof-SBT contracts will need
interface IHubMinimal {
   function rootIsRecent(uint256) external view returns (bool);
}