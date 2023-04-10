// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
interface IAccessControlContract {
   function hasAccess(address addr, bytes32 tagId) external view returns (bool hasAccess);
}