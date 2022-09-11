// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
interface IVerifier {
   function verifyFromBytes(bytes memory) external view returns (bool);
}