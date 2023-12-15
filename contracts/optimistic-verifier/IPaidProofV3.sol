pragma solidity ^0.8.0;
interface IPaidProofV3 {
    function setFee(bytes32 circuitId, uint newFee) external;
    function collectFees() external;
}
