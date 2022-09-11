// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./PairingAndProof.sol";
interface IVerifier {
   function verifyEncoded(Proof memory proof, bytes memory input) external view returns (bool);
}