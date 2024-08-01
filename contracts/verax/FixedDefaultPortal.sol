// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import { AttestationPayload } from "@verax-attestation-registry/verax-contracts/contracts/types/Structs.sol";
import { AbstractPortal } from "@verax-attestation-registry/verax-contracts/contracts/abstracts/AbstractPortal.sol";
/**
 * Default Verax portal that fixes the replacement vulnerability.
 */
contract FixedDefaultPortal is AbstractPortal {
    constructor(address[] memory modules, address router) AbstractPortal(modules, router) {}

    /// @inheritdoc AbstractPortal
    function withdraw(address payable to, uint256 amount) external override {}

    /// @inheritdoc AbstractPortal
    function _onReplace(
        bytes32 attestationId,
        AttestationPayload memory attestationPayload,
        address attester,
        uint256 value
    ) internal virtual override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }

    /// @inheritdoc AbstractPortal
    function _onBulkReplace(
        bytes32[] memory attestationIds,
        AttestationPayload[] memory attestationsPayloads,
        bytes[][] memory validationPayloads
    ) internal virtual override {
        if (msg.sender != portalRegistry.getPortalByAddress(address(this)).ownerAddress) revert OnlyPortalOwner();
    }
}
