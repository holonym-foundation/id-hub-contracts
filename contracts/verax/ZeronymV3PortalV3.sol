// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import { AttestationPayload } from "@verax-attestation-registry/verax-contracts/contracts/types/Structs.sol";
import { AbstractPortal } from "@verax-attestation-registry/verax-contracts/contracts/abstracts/AbstractPortal.sol";

/**
 * Default Verax portal that fixes the replacement vulnerability and only allows
 * attestations with the Zeonym schema ID.
 */
contract ZeronymV3PortalV3 is AbstractPortal {

    error InvalidSchemaId();
    error InvalidAttestor();
    error Deprecated();

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

    function _onAttestV2(
        AttestationPayload memory attestationPayload,
        bytes[] memory validationPayloads,
        uint256 value
    ) internal virtual override {
        // Make sure attestor is Zeronym's attestor
        if (msg.sender != address(0xB1f50c6C34C72346b1229e5C80587D0D659556Fd)) {
            revert InvalidAttestor();
        }
        if (attestationPayload.schemaId != bytes32(0x1c14fd320660a59a50eb1f795116193a59c26f2463c0705b79d8cb97aa9f419b)) {
            revert InvalidSchemaId();
        }
    }

    function _onAttest(
        AttestationPayload memory attestationPayload,
        address attester,
        uint256 value
    ) internal virtual override {
        revert Deprecated();
    }
}
