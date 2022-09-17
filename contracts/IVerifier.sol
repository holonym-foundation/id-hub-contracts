// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./PairingAndProof.sol";
interface IVerifier {
   function verifyEncoded(Proof calldata proof, uint[] calldata input_) external view returns (bool);
}