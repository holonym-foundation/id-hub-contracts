// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

// import { SchemaResolver } from "../SchemaResolver.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";

// import { IEAS, Attestation } from "../../IEAS.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/EAS.sol";

/// @title AttesterResolver
/// @notice A sample schema resolver that checks whether the attestation is from a specific attester.
contract AttesterResolver is SchemaResolver {
    error OnlyCurrentAttester();

    address public _targetAttester;

    constructor(IEAS eas, address targetAttester) SchemaResolver(eas) {
        _targetAttester = targetAttester;
    }

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal view override returns (bool) {
        return attestation.attester == _targetAttester;
    }

    function onRevoke(Attestation calldata /*attestation*/, uint256 /*value*/) internal pure override returns (bool) {
        return true;
    }

    function setTargetAttester(address newTargetAttester) external {
        // Only the current attester can change the target attester
        if (msg.sender != _targetAttester) {
            revert OnlyCurrentAttester();
        }
        _targetAttester = newTargetAttester;
    }

}
