// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IHub {
    function setSBT(
        bytes32 circuitId,
        uint256 sbtReciever,
        uint256 expiration,
        uint256 customFee,
        uint256 nullifier,
        uint256[] calldata publicValues,
        bytes memory signature
    ) external payable;
}

/**
 * @title HubBatch
 * @notice Batch contract for calling Hub.setSBT multiple times in a single transaction
 * @dev This allows the relayer to process multiple users in one transaction
 */
contract HubBatch {
    IHub public immutable hub;

    constructor(address _hub) {
        hub = IHub(_hub);
    }

    /**
     * @notice Batch mint SBTs for multiple users
     * @dev Each array parameter corresponds to one setSBT call
     * @dev Failed individual setSBT calls will not revert the entire batch
     */
    function setSBTBatch(
        bytes32[] calldata circuitIds,
        uint256[] calldata sbtRecievers,
        uint256[] calldata expirations,
        uint256[] calldata customFees,
        uint256[] calldata nullifiers,
        uint256[][] calldata publicValues,
        bytes[] calldata signatures
    ) external {
        uint256 length = circuitIds.length;
        require(length == sbtRecievers.length, "Length mismatch");
        require(length == expirations.length, "Length mismatch");
        require(length == customFees.length, "Length mismatch");
        require(length == nullifiers.length, "Length mismatch");
        require(length == publicValues.length, "Length mismatch");
        require(length == signatures.length, "Length mismatch");

        for (uint256 i = 0; i < length; i++) {
            // Use try/catch to continue on failure
            try hub.setSBT{value: 0}(
                circuitIds[i],
                sbtRecievers[i],
                expirations[i],
                customFees[i],
                nullifiers[i],
                publicValues[i],
                signatures[i]
            ) {
                // Success - continue to next
            } catch {
                // Failure - continue to next (individual failures don't stop the batch)
                // You could emit an event here if you want to track failures on-chain
            }
        }
    }

    /**
     * @notice Alternative version that reverts on any individual failure
     * @dev Use this if you want all-or-nothing behavior
     */
    function setSBTBatchStrict(
        bytes32[] calldata circuitIds,
        uint256[] calldata sbtRecievers,
        uint256[] calldata expirations,
        uint256[] calldata customFees,
        uint256[] calldata nullifiers,
        uint256[][] calldata publicValues,
        bytes[] calldata signatures
    ) external {
        uint256 length = circuitIds.length;
        require(length <= 100, "Batch too large");
        require(length == sbtRecievers.length, "Length mismatch");
        require(length == expirations.length, "Length mismatch");
        require(length == customFees.length, "Length mismatch");
        require(length == nullifiers.length, "Length mismatch");
        require(length == publicValues.length, "Length mismatch");
        require(length == signatures.length, "Length mismatch");

        for (uint256 i = 0; i < length; i++) {
            hub.setSBT{value: 0}(
                circuitIds[i],
                sbtRecievers[i],
                expirations[i],
                customFees[i],
                nullifiers[i],
                publicValues[i],
                signatures[i]
            );
        }
    }
}
