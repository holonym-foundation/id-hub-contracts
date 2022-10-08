// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
interface IResidencyStore {
   function usResidency(address) external view returns (bool);
}